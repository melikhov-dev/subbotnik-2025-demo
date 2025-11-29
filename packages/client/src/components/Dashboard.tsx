import { Card, Table } from '@gravity-ui/uikit';
import './Dashboard.css';

const salesColumns = [
  { id: 'date', name: 'Дата' },
  { id: 'sales', name: 'Продажи, ₽' },
  { id: 'orders', name: 'Заказы' },
];

const currentMonthData = [
  { date: '2024-11-01', sales: '45 000', orders: 120 },
  { date: '2024-11-02', sales: '52 000', orders: 135 },
  { date: '2024-11-03', sales: '48 000', orders: 128 },
  { date: '2024-11-04', sales: '61 000', orders: 155 },
  { date: '2024-11-05', sales: '58 000', orders: 148 },
];

const categoryColumns = [
  { id: 'category', name: 'Категория' },
  { id: 'revenue', name: 'Доход, ₽' },
  { id: 'orders', name: 'Заказы' },
];

const categoryData = [
  { category: 'Электроника', revenue: '185 000', orders: 420 },
  { category: 'Одежда', revenue: '142 000', orders: 680 },
  { category: 'Продукты', revenue: '98 000', orders: 950 },
  { category: 'Книги', revenue: '67 000', orders: 320 },
  { category: 'Спорт', revenue: '60 000', orders: 240 },
];

const topProductsColumns = [
  { id: 'product', name: 'Продукт' },
  { id: 'sales', name: 'Продажи, ₽' },
  { id: 'orders', name: 'Заказов' },
];

const topProductsData = [
  { product: 'iPhone 15 Pro', sales: '95 000', orders: 95 },
  { product: 'MacBook Air M2', sales: '78 000', orders: 65 },
  { product: 'AirPods Pro', sales: '52 000', orders: 260 },
  { product: 'Apple Watch', sales: '48 000', orders: 120 },
  { product: 'iPad Air', sales: '42 000', orders: 70 },
];

function Dashboard() {
  return (
    <div className="dashboard">
      <Card className="dashboard-card">
        <h3>📊 Продажи (ноябрь 2024)</h3>
        <div className="dashboard-content">
          <Table columns={salesColumns} data={currentMonthData} />
        </div>
      </Card>

      <Card className="dashboard-card">
        <h3>📈 Доход по категориям</h3>
        <div className="dashboard-content">
          <Table columns={categoryColumns} data={categoryData} />
        </div>
      </Card>

      <Card className="dashboard-card">
        <h3>🏆 Топ-5 продуктов</h3>
        <div className="dashboard-content">
          <Table columns={topProductsColumns} data={topProductsData} />
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
