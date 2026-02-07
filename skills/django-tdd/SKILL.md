---
name: django-tdd
description: 使用 pytest-django、测试驱动开发（TDD）方法论、factory_boy、Mock 模拟、覆盖率统计以及 Django REST Framework API 测试的 Django 测试策略。
---

# Django TDD 测试指南

使用 pytest、factory_boy 和 Django REST Framework 对 Django 应用进行测试驱动开发（TDD）。

## 何时激活

- 编写新的 Django 应用程序时
- 实现 Django REST Framework API 时
- 测试 Django 模型（Models）、视图（Views）和序列化器（Serializers）时
- 为 Django 项目搭建测试基础设施时

## Django 的 TDD 工作流

### 红-绿-重构循环（Red-Green-Refactor Cycle）

```python
# 步骤 1：红色（RED） - 编写失败的测试
def test_user_creation():
    user = User.objects.create_user(email='test@example.com', password='testpass123')
    assert user.email == 'test@example.com'
    assert user.check_password('testpass123')
    assert not user.is_staff

# 步骤 2：绿色（GREEN） - 编写代码使测试通过
# 创建 User 模型或工厂（Factory）

# 步骤 3：重构（REFACTOR） - 在保持测试通过的前提下优化代码
```

## 环境搭建

### pytest 配置

```ini
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings.test
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --reuse-db
    --nomigrations
    --cov=apps
    --cov-report=html
    --cov-report=term-missing
    --strict-markers
markers =
    slow: 标记为耗时较长的测试
    integration: 标记为集成测试
```

### 测试设置（Settings）

```python
# config/settings/test.py
from .base import *

DEBUG = True
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# 禁用迁移以提升速度
class DisableMigrations:
    def __contains__(self, item):
        return True

    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# 使用更快的密码哈希算法
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# 邮件后端配置
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Celery 始终同步执行
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
```

### conftest.py

```python
# tests/conftest.py
import pytest
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture(autouse=True)
def timezone_settings(settings):
    """确保时区一致。"""
    settings.TIME_ZONE = 'UTC'

@pytest.fixture
def user(db):
    """创建测试用户。"""
    return User.objects.create_user(
        email='test@example.com',
        password='testpass123',
        username='testuser'
    )

@pytest.fixture
def admin_user(db):
    """创建管理员用户。"""
    return User.objects.create_superuser(
        email='admin@example.com',
        password='adminpass123',
        username='admin'
    )

@pytest.fixture
def authenticated_client(client, user):
    """返回已认证的客户端。"""
    client.force_login(user)
    return client

@pytest.fixture
def api_client():
    """返回 DRF API 客户端。"""
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def authenticated_api_client(api_client, user):
    """返回已认证的 API 客户端。"""
    api_client.force_authenticate(user=user)
    return api_client
```

## Factory Boy

### 工厂配置

```python
# tests/factories.py
import factory
from factory import fuzzy
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from apps.products.models import Product, Category

User = get_user_model()

class UserFactory(factory.django.DjangoModelFactory):
    """User 模型的工厂类。"""

    class Meta:
        model = User

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    username = factory.Sequence(lambda n: f"user{n}")
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    is_active = True

class CategoryFactory(factory.django.DjangoModelFactory):
    """Category 模型的工厂类。"""

    class Meta:
        model = Category

    name = factory.Faker('word')
    slug = factory.LazyAttribute(lambda obj: obj.name.lower())
    description = factory.Faker('text')

class ProductFactory(factory.django.DjangoModelFactory):
    """Product 模型的工厂类。"""

    class Meta:
        model = Product

    name = factory.Faker('sentence', nb_words=3)
    slug = factory.LazyAttribute(lambda obj: obj.name.lower().replace(' ', '-'))
    description = factory.Faker('text')
    price = fuzzy.FuzzyDecimal(10.00, 1000.00, 2)
    stock = fuzzy.FuzzyInteger(0, 100)
    is_active = True
    category = factory.SubFactory(CategoryFactory)
    created_by = factory.SubFactory(UserFactory)

    @factory.post_generation
    def tags(self, create, extracted, **kwargs):
        """为产品添加标签。"""
        if not create:
            return
        if extracted:
            for tag in extracted:
                self.tags.add(tag)
```

### 使用工厂

```python
# tests/test_models.py
import pytest
from tests.factories import ProductFactory, UserFactory

def test_product_creation():
    """测试使用工厂创建产品。"""
    product = ProductFactory(price=100.00, stock=50)
    assert product.price == 100.00
    assert product.stock == 50
    assert product.is_active is True

def test_product_with_tags():
    """测试带有标签的产品。"""
    tags = [TagFactory(name='electronics'), TagFactory(name='new')]
    product = ProductFactory(tags=tags)
    assert product.tags.count() == 2

def test_multiple_products():
    """测试创建多个产品。"""
    products = ProductFactory.create_batch(10)
    assert len(products) == 10
```

## 模型测试（Model Testing）

### 模型测试用例

```python
# tests/test_models.py
import pytest
from django.core.exceptions import ValidationError
from tests.factories import UserFactory, ProductFactory

class TestUserModel:
    """测试 User 模型。"""

    def test_create_user(self, db):
        """测试创建普通用户。"""
        user = UserFactory(email='test@example.com')
        assert user.email == 'test@example.com'
        assert user.check_password('testpass123')
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_superuser(self, db):
        """测试创建超级用户。"""
        user = UserFactory(
            email='admin@example.com',
            is_staff=True,
            is_superuser=True
        )
        assert user.is_staff
        assert user.is_superuser

    def test_user_str(self, db):
        """测试用户字符串表示形式。"""
        user = UserFactory(email='test@example.com')
        assert str(user) == 'test@example.com'

class TestProductModel:
    """测试 Product 模型。"""

    def test_product_creation(self, db):
        """测试创建产品。"""
        product = ProductFactory()
        assert product.id is not None
        assert product.is_active is True
        assert product.created_at is not None

    def test_product_slug_generation(self, db):
        """测试 Slug 自动生成。"""
        product = ProductFactory(name='Test Product')
        assert product.slug == 'test-product'

    def test_product_price_validation(self, db):
        """测试价格不能为负数。"""
        product = ProductFactory(price=-10)
        with pytest.raises(ValidationError):
            product.full_clean()

    def test_product_manager_active(self, db):
        """测试 active 管理器方法。"""
        ProductFactory.create_batch(5, is_active=True)
        ProductFactory.create_batch(3, is_active=False)

        active_count = Product.objects.active().count()
        assert active_count == 5

    def test_product_stock_management(self, db):
        """测试库存管理。"""
        product = ProductFactory(stock=10)
        product.reduce_stock(5)
        product.refresh_from_db()
        assert product.stock == 5

        with pytest.raises(ValueError):
            product.reduce_stock(10)  # 库存不足
```

## 视图测试（View Testing）

### Django 视图测试

```python
# tests/test_views.py
import pytest
from django.urls import reverse
from tests.factories import ProductFactory, UserFactory

class TestProductViews:
    """测试产品视图。"""

    def test_product_list(self, client, db):
        """测试产品列表视图。"""
        ProductFactory.create_batch(10)

        response = client.get(reverse('products:list'))

        assert response.status_code == 200
        assert len(response.context['products']) == 10

    def test_product_detail(self, client, db):
        """测试产品详情视图。"""
        product = ProductFactory()

        response = client.get(reverse('products:detail', kwargs={'slug': product.slug}))

        assert response.status_code == 200
        assert response.context['product'] == product

    def test_product_create_requires_login(self, client, db):
        """测试创建产品需要登录认证。"""
        response = client.get(reverse('products:create'))

        assert response.status_code == 302
        assert response.url.startswith('/accounts/login/')

    def test_product_create_authenticated(self, authenticated_client, db):
        """测试以已认证用户身份创建产品。"""
        response = authenticated_client.get(reverse('products:create'))

        assert response.status_code == 200

    def test_product_create_post(self, authenticated_client, db, category):
        """测试通过 POST 请求创建产品。"""
        data = {
            'name': 'Test Product',
            'description': 'A test product',
            'price': '99.99',
            'stock': 10,
            'category': category.id,
        }

        response = authenticated_client.post(reverse('products:create'), data)

        assert response.status_code == 302
        assert Product.objects.filter(name='Test Product').exists()
```

## DRF API 测试

### 序列化器测试

```python
# tests/test_serializers.py
import pytest
from rest_framework.exceptions import ValidationError
from apps.products.serializers import ProductSerializer
from tests.factories import ProductFactory

class TestProductSerializer:
    """测试 ProductSerializer。"""

    def test_serialize_product(self, db):
        """测试序列化产品对象。"""
        product = ProductFactory()
        serializer = ProductSerializer(product)

        data = serializer.data

        assert data['id'] == product.id
        assert data['name'] == product.name
        assert data['price'] == str(product.price)

    def test_deserialize_product(self, db):
        """测试反序列化产品数据。"""
        data = {
            'name': 'Test Product',
            'description': 'Test description',
            'price': '99.99',
            'stock': 10,
            'category': 1,
        }

        serializer = ProductSerializer(data=data)

        assert serializer.is_valid()
        product = serializer.save()

        assert product.name == 'Test Product'
        assert float(product.price) == 99.99

    def test_price_validation(self, db):
        """测试价格验证。"""
        data = {
            'name': 'Test Product',
            'price': '-10.00',
            'stock': 10,
        }

        serializer = ProductSerializer(data=data)

        assert not serializer.is_valid()
        assert 'price' in serializer.errors

    def test_stock_validation(self, db):
        """测试库存不能为负数。"""
        data = {
            'name': 'Test Product',
            'price': '99.99',
            'stock': -5,
        }

        serializer = ProductSerializer(data=data)

        assert not serializer.is_valid()
        assert 'stock' in serializer.errors
```

### API ViewSet 测试

```python
# tests/test_api.py
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from tests.factories import ProductFactory, UserFactory

class TestProductAPI:
    """测试产品 API 接口。"""

    @pytest.fixture
    def api_client(self):
        """返回 API 客户端。"""
        return APIClient()

    def test_list_products(self, api_client, db):
        """测试列出产品。"""
        ProductFactory.create_batch(10)

        url = reverse('api:product-list')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 10

    def test_retrieve_product(self, api_client, db):
        """测试获取单个产品详情。"""
        product = ProductFactory()

        url = reverse('api:product-detail', kwargs={'pk': product.id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == product.id

    def test_create_product_unauthorized(self, api_client, db):
        """测试未授权时创建产品。"""
        url = reverse('api:product-list')
        data = {'name': 'Test Product', 'price': '99.99'}

        response = api_client.post(url, data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_product_authorized(self, authenticated_api_client, db):
        """测试以已认证用户身份创建产品。"""
        url = reverse('api:product-list')
        data = {
            'name': 'Test Product',
            'description': 'Test',
            'price': '99.99',
            'stock': 10,
        }

        response = authenticated_api_client.post(url, data)

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Test Product'

    def test_update_product(self, authenticated_api_client, db):
        """测试更新产品。"""
        product = ProductFactory(created_by=authenticated_api_client.user)

        url = reverse('api:product-detail', kwargs={'pk': product.id})
        data = {'name': 'Updated Product'}

        response = authenticated_api_client.patch(url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Updated Product'

    def test_delete_product(self, authenticated_api_client, db):
        """测试删除产品。"""
        product = ProductFactory(created_by=authenticated_api_client.user)

        url = reverse('api:product-detail', kwargs={'pk': product.id})
        response = authenticated_api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_filter_products_by_price(self, api_client, db):
        """测试按价格过滤产品。"""
        ProductFactory(price=50)
        ProductFactory(price=150)

        url = reverse('api:product-list')
        response = api_client.get(url, {'price_min': 100})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1

    def test_search_products(self, api_client, db):
        """测试搜索产品。"""
        ProductFactory(name='Apple iPhone')
        ProductFactory(name='Samsung Galaxy')

        url = reverse('api:product-list')
        response = api_client.get(url, {'search': 'Apple'})

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 1
```

## Mock 模拟与补丁（Mocking and Patching）

### 模拟外部服务

```python
# tests/test_views.py
from unittest.mock import patch, Mock
import pytest

class TestPaymentView:
    """使用模拟支付网关测试支付视图。"""

    @patch('apps.payments.services.stripe')
    def test_successful_payment(self, mock_stripe, client, user, product):
        """使用模拟的 Stripe 测试成功支付。"""
        # 配置模拟对象
        mock_stripe.Charge.create.return_value = {
            'id': 'ch_123',
            'status': 'succeeded',
            'amount': 9999,
        }

        client.force_login(user)
        response = client.post(reverse('payments:process'), {
            'product_id': product.id,
            'token': 'tok_visa',
        })

        assert response.status_code == 302
        mock_stripe.Charge.create.assert_called_once()

    @patch('apps.payments.services.stripe')
    def test_failed_payment(self, mock_stripe, client, user, product):
        """测试支付失败。"""
        mock_stripe.Charge.create.side_effect = Exception('Card declined')

        client.force_login(user)
        response = client.post(reverse('payments:process'), {
            'product_id': product.id,
            'token': 'tok_visa',
        })

        assert response.status_code == 302
        assert 'error' in response.url
```

### 模拟邮件发送

```python
# tests/test_email.py
from django.core import mail
from django.test import override_settings

@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
def test_order_confirmation_email(db, order):
    """测试订单确认邮件。"""
    order.send_confirmation_email()

    assert len(mail.outbox) == 1
    assert order.user.email in mail.outbox[0].to
    assert 'Order Confirmation' in mail.outbox[0].subject
```

## 集成测试（Integration Testing）

### 全流程测试

```python
# tests/test_integration.py
import pytest
from django.urls import reverse
from tests.factories import UserFactory, ProductFactory

class TestCheckoutFlow:
    """测试完整的结账流程。"""

    def test_guest_to_purchase_flow(self, client, db):
        """测试从游客到购买完成的完整流程。"""
        # 步骤 1：注册
        response = client.post(reverse('users:register'), {
            'email': 'test@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
        })
        assert response.status_code == 302

        # 步骤 2：登录
        response = client.post(reverse('users:login'), {
            'email': 'test@example.com',
            'password': 'testpass123',
        })
        assert response.status_code == 302

        # 步骤 3：浏览产品
        product = ProductFactory(price=100)
        response = client.get(reverse('products:detail', kwargs={'slug': product.slug}))
        assert response.status_code == 200

        # 步骤 4：添加到购物车
        response = client.post(reverse('cart:add'), {
            'product_id': product.id,
            'quantity': 1,
        })
        assert response.status_code == 302

        # 步骤 5：结账
        response = client.get(reverse('checkout:review'))
        assert response.status_code == 200
        assert product.name in response.content.decode()

        # 步骤 6：完成购买
        with patch('apps.checkout.services.process_payment') as mock_payment:
            mock_payment.return_value = True
            response = client.post(reverse('checkout:complete'))

        assert response.status_code == 302
        assert Order.objects.filter(user__email='test@example.com').exists()
```

## 测试最佳实践

### 推荐做法（DO）

- **使用工厂（Factories）**：避免手动创建对象。
- **每个测试一个断言**：保持测试专注。
- **描述性测试名称**：如 `test_user_cannot_delete_others_post`。
- **测试边界情况**：空输入、None 值、边界条件。
- **模拟（Mock）外部服务**：不要依赖外部 API。
- **使用 Fixtures**：消除重复代码。
- **测试权限控制**：确保授权逻辑正常工作。
- **保持测试运行迅速**：使用 `--reuse-db` 和 `--nomigrations`。

### 避免做法（DON'T）

- **不要测试 Django 内部机制**：相信 Django 自身已通过测试。
- **不要测试第三方库代码**：相信库作者的测试。
- **不要忽略失败的测试**：所有测试都必须通过。
- **不要让测试产生依赖**：测试应该可以以任何顺序运行。
- **不要过度模拟**：仅对外部依赖项进行 Mock。
- **不要测试私有方法**：测试公共接口。
- **不要使用生产数据库**：始终使用专用测试数据库。

## 覆盖率（Coverage）

### 覆盖率配置

```bash
# 运行带有覆盖率统计的测试
pytest --cov=apps --cov-report=html --cov-report=term-missing

# 生成并查看 HTML 报告
open htmlcov/index.html
```

### 覆盖率目标

| 组件 | 目标覆盖率 |
|-----------|-----------------|
| 模型 (Models) | 90%+ |
| 序列化器 (Serializers) | 85%+ |
| 视图 (Views) | 80%+ |
| 服务层 (Services) | 90%+ |
| 工具类 (Utilities) | 80%+ |
| 总体 (Overall) | 80%+ |

## 快速参考

| 模式 | 用法 |
|---------|-------|
| `@pytest.mark.django_db` | 启用数据库访问 |
| `client` | Django 测试客户端 |
| `api_client` | DRF API 客户端 |
| `factory.create_batch(n)` | 创建多个对象 |
| `patch('module.function')` | 模拟外部依赖 |
| `override_settings` | 临时更改设置 |
| `force_authenticate()` | 在测试中绕过认证 |
| `assertRedirects` | 检查重定向 |
| `assertTemplateUsed` | 验证模板使用情况 |
| `mail.outbox` | 检查已发送的邮件 |

请记住：测试即文档。良好的测试能够解释代码的预期工作方式。保持测试简单、易读且易于维护。
