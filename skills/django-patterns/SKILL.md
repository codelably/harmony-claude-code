---
name: django-patterns
description: Django 架构模式、使用 DRF 的 REST API 设计、ORM 最佳实践、缓存、信号（Signals）、中间件（Middleware）以及生产级 Django 应用。
---

# Django 开发模式

适用于可扩展、可维护应用程序的生产级 Django 架构模式。

## 何时激活

- 构建 Django Web 应用程序时
- 设计 Django REST Framework (DRF) API 时
- 处理 Django ORM 和模型时
- 设置 Django 项目结构时
- 实现缓存（Caching）、信号（Signals）、中间件（Middleware）时

## 项目结构

### 推荐布局

```
myproject/
├── config/
│   ├── __init__.py
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py          # 基础设置
│   │   ├── development.py   # 开发环境设置
│   │   ├── production.py    # 生产环境设置
│   │   └── test.py          # 测试环境设置
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── manage.py
└── apps/
    ├── __init__.py
    ├── users/
    │   ├── __init__.py
    │   ├── models.py
    │   ├── views.py
    │   ├── serializers.py
    │   ├── urls.py
    │   ├── permissions.py
    │   ├── filters.py
    │   ├── services.py
    │   └── tests/
    └── products/
        └── ...
```

### 分离设置模式（Split Settings Pattern）

```python
# config/settings/base.py
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = env('DJANGO_SECRET_KEY')
DEBUG = False
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    # 本地应用
    'apps.users',
    'apps.products',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST'),
        'PORT': env('DB_PORT', default='5432'),
    }
}

# config/settings/development.py
from .base import *

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

DATABASES['default']['NAME'] = 'myproject_dev'

INSTALLED_APPS += ['debug_toolbar']

MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# config/settings/production.py
from .base import *

DEBUG = False
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# 日志配置
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': '/var/log/django/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': True,
        },
    },
}
```

## 模型设计模式

### 模型最佳实践

```python
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    """扩展 AbstractUser 的自定义用户模型。"""
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    birth_date = models.DateField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'user'
        verbose_name_plural = 'users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

class Product(models.Model):
    """带有适当字段配置的产品模型。"""
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, max_length=250)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    category = models.ForeignKey(
        'Category',
        on_delete=models.CASCADE,
        related_name='products'
    )
    tags = models.ManyToManyField('Tag', blank=True, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['category', 'is_active']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(price__gte=0),
                name='price_non_negative'
            )
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
```

### QuerySet 最佳实践

```python
from django.db import models

class ProductQuerySet(models.QuerySet):
    """Product 模型的自定义 QuerySet。"""

    def active(self):
        """仅返回已激活的产品。"""
        return self.filter(is_active=True)

    def with_category(self):
        """使用 select_related 加载分类，避免 N+1 查询。"""
        return self.select_related('category')

    def with_tags(self):
        """使用 prefetch_related 预加载多对多关系的标签。"""
        return self.prefetch_related('tags')

    def in_stock(self):
        """返回库存 > 0 的产品。"""
        return self.filter(stock__gt=0)

    def search(self, query):
        """按名称或描述搜索产品。"""
        return self.filter(
            models.Q(name__icontains=query) |
            models.Q(description__icontains=query)
        )

class Product(models.Model):
    # ... 字段 ...

    objects = ProductQuerySet.as_manager()  # 使用自定义 QuerySet

# 用法
Product.objects.active().with_category().in_stock()
```

### 管理器（Manager）方法

```python
class ProductManager(models.Manager):
    """用于复杂查询的自定义管理器。"""

    def get_or_none(self, **kwargs):
        """返回对象，或者在不存在时返回 None 而不是抛出 DoesNotExist。"""
        try:
            return self.get(**kwargs)
        except self.model.DoesNotExist:
            return None

    def create_with_tags(self, name, price, tag_names):
        """创建产品并关联标签。"""
        product = self.create(name=name, price=price)
        tags = [Tag.objects.get_or_create(name=name)[0] for name in tag_names]
        product.tags.set(tags)
        return product

    def bulk_update_stock(self, product_ids, quantity):
        """批量更新多个产品的库存。"""
        return self.filter(id__in=product_ids).update(stock=quantity)

# 在模型中
class Product(models.Model):
    # ... 字段 ...
    custom = ProductManager()
```

## Django REST Framework 模式

### 序列化器（Serializer）模式

```python
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Product, User

class ProductSerializer(serializers.ModelSerializer):
    """Product 模型的序列化器。"""

    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    discount_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price',
            'discount_price', 'stock', 'category_name',
            'average_rating', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at']

    def get_discount_price(self, obj):
        """如果适用，计算折扣价。"""
        if hasattr(obj, 'discount') and obj.discount:
            return obj.price * (1 - obj.discount.percent / 100)
        return obj.price

    def validate_price(self, value):
        """确保价格非负。"""
        if value < 0:
            raise serializers.ValidationError("价格不能为负数。")
        return value

class ProductCreateSerializer(serializers.ModelSerializer):
    """用于创建产品的序列化器。"""

    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'stock', 'category']

    def validate(self, data):
        """多字段的自定义校验。"""
        if data['price'] > 10000 and data['stock'] > 100:
            raise serializers.ValidationError(
                "高价值产品不能有大量库存。"
            )
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    """用户注册序列化器。"""

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm']

    def validate(self, data):
        """校验两次输入的密码是否一致。"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                "password_confirm": "密码字段不匹配。"
            })
        return data

    def create(self, validated_data):
        """创建并保存加密后的密码。"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user
```

### 视图集（ViewSet）模式

```python
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product
from .serializers import ProductSerializer, ProductCreateSerializer
from .permissions import IsOwnerOrReadOnly
from .filters import ProductFilter
from .filters import ProductFilter
from .services import ProductService

class ProductViewSet(viewsets.ModelViewSet):
    """Product 模型的视图集。"""

    queryset = Product.objects.select_related('category').prefetch_related('tags')
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """根据操作（action）返回适当的序列化器类。"""
        if self.action == 'create':
            return ProductCreateSerializer
        return ProductSerializer

    def perform_create(self, serializer):
        """在保存时关联当前用户上下文。"""
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """返回推荐产品。"""
        featured = self.queryset.filter(is_featured=True)[:10]
        serializer = self.get_serializer(featured, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def purchase(self, request, pk=None):
        """购买产品。"""
        product = self.get_object()
        service = ProductService()
        result = service.purchase(product, request.user)
        return Response(result, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_products(self, request):
        """返回由当前用户创建的产品。"""
        products = self.queryset.filter(created_by=request.user)
        page = self.paginate_queryset(products)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
```

### 自定义操作

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_to_cart(request):
    """将产品添加到用户购物车。"""
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)

    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': '产品未找到'},
            status=status.HTTP_404_NOT_FOUND
        )

    cart, _ = Cart.objects.get_or_create(user=request.user)
    CartItem.objects.create(
        cart=cart,
        product=product,
        quantity=quantity
    )

    return Response({'message': '已添加到购物车'}, status=status.HTTP_201_CREATED)
```

## 服务层模式（Service Layer Pattern）

```python
# apps/orders/services.py
from typing import Optional
from django.db import transaction
from .models import Order, OrderItem

class OrderService:
    """订单相关业务逻辑的服务层。"""

    @staticmethod
    @transaction.atomic
    def create_order(user, cart: Cart) -> Order:
        """从购物车创建订单。"""
        order = Order.objects.create(
            user=user,
            total_price=cart.total_price
        )

        for item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )

        # 清空购物车
        cart.items.all().delete()

        return order

    @staticmethod
    def process_payment(order: Order, payment_data: dict) -> bool:
        """处理订单支付。"""
        # 与支付网关集成
        payment = PaymentGateway.charge(
            amount=order.total_price,
            token=payment_data['token']
        )

        if payment.success:
            order.status = Order.Status.PAID
            order.save()
            # 发送确认邮件
            OrderService.send_confirmation_email(order)
            return True

        return False

    @staticmethod
    def send_confirmation_email(order: Order):
        """发送订单确认邮件。"""
        # 邮件发送逻辑
        pass
```

## 缓存策略（Caching Strategies）

### 视图级缓存

```python
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 15), name='dispatch')  # 15 分钟
class ProductListView(generic.ListView):
    model = Product
    template_name = 'products/list.html'
    context_object_name = 'products'
```

### 模板片段缓存

```django
{% load cache %}
{% cache 500 sidebar %}
    ... 耗时的侧边栏内容 ...
{% endcache %}
```

### 低级缓存

```python
from django.core.cache import cache

def get_featured_products():
    """通过缓存获取推荐产品。"""
    cache_key = 'featured_products'
    products = cache.get(cache_key)

    if products is None:
        products = list(Product.objects.filter(is_featured=True))
        cache.set(cache_key, products, timeout=60 * 15)  # 15 分钟

    return products
```

### QuerySet 缓存

```python
from django.core.cache import cache

def get_popular_categories():
    cache_key = 'popular_categories'
    categories = cache.get(cache_key)

    if categories is None:
        categories = list(Category.objects.annotate(
            product_count=Count('products')
        ).filter(product_count__gt=10).order_by('-product_count')[:20])
        cache.set(cache_key, categories, timeout=60 * 60)  # 1 小时

    return categories
```

## 信号（Signals）

### 信号模式

```python
# apps/users/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Profile

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """当用户创建时同步创建 Profile。"""
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """当用户保存时同步保存 Profile。"""
    instance.profile.save()

# apps/users/apps.py
from django.apps import AppConfig

class UsersConfig(AppConfigConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        """在应用准备就绪时导入信号。"""
        import apps.users.signals
```

## 中间件（Middleware）

### 自定义中间件

```python
# middleware/active_user_middleware.py
import time
from django.utils.deprecation import MiddlewareMixin

class ActiveUserMiddleware(MiddlewareMixin):
    """用于跟踪活跃用户的中间件。"""

    def process_request(self, request):
        """处理传入请求。"""
        if request.user.is_authenticated:
            # 更新最后活跃时间
            request.user.last_active = timezone.now()
            request.user.save(update_fields=['last_active'])

class RequestLoggingMiddleware(MiddlewareMixin):
    """用于记录请求日志的中间件。"""

    def process_request(self, request):
        """记录请求开始时间。"""
        request.start_time = time.time()

    def process_response(self, request, response):
        """记录请求耗时。"""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.info(f'{request.method} {request.path} - {response.status_code} - {duration:.3f}s')
        return response
```

## 性能优化（Performance Optimization）

### 防止 N+1 查询

```python
# 差劲 - N+1 查询
products = Product.objects.all()
for product in products:
    print(product.category.name)  # 为每个产品单独进行一次查询

# 优秀 - 使用 select_related 进行单次查询
products = Product.objects.select_related('category').all()
for product in products:
    print(product.category.name)

# 优秀 - 对多对多关系使用 prefetch_related
products = Product.objects.prefetch_related('tags').all()
for product in products:
    for tag in product.tags.all():
        print(tag.name)
```

### 数据库索引

```python
class Product(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['category', 'created_at']),
        ]
```

### 批量操作

```python
# 批量创建
Product.objects.bulk_create([
    Product(name=f'Product {i}', price=10.00)
    for i in range(1000)
])

# 批量更新
products = Product.objects.all()[:100]
for product in products:
    product.is_active = True
Product.objects.bulk_update(products, ['is_active'])

# 批量删除
Product.objects.filter(stock=0).delete()
```

## 快速参考

| 模式 | 描述 |
|---------|-------------|
| 分离设置（Split settings） | 区分开发/生产/测试环境配置 |
| 自定义 QuerySet | 可复用的查询方法 |
| 服务层（Service Layer） | 业务逻辑解耦 |
| 视图集（ViewSet） | REST API 端点封装 |
| 序列化器校验（Serializer validation） | 请求/响应数据的转换与验证 |
| select_related | 外键关系优化 |
| prefetch_related | 多对多关系优化 |
| 缓存优先（Cache first） | 对耗时操作进行缓存 |
| 信号（Signals） | 事件驱动的操作 |
| 中间件（Middleware） | 请求/响应拦截处理 |

记住：Django 提供了许多捷径，但对于生产级应用，架构和组织结构比简洁的代码更重要。请为可维护性而构建。
