import React, { useEffect, useState } from 'react';
import { BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, ResponsiveContainer } from 'recharts';
import { Table} from 'antd';
import Papa from 'papaparse';
import { Car, FileSpreadsheet, BarChart3, LucideIcon } from 'lucide-react';

interface EVData {
  Make: string;
  Model: string;
  [key: string]: string | number;
}

interface StatsData {
  totalVehicles: number;
  uniqueMakes: number;
  uniqueModels: number;
  averageRange: number;
}

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: number;
  bgColor: string;
}

const EVDashboard = () => {
  const [data, setData] = useState<EVData[]>([]);
  const [filteredData, setFilteredData] = useState<EVData[]>([]);
  const [statsData, setStatsData] = useState<StatsData>({
    totalVehicles: 0,
    uniqueMakes: 0,
    uniqueModels: 0,
    averageRange: 0
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/ev-population.csv');
        const csvText = await response.text();
        
        Papa.parse<EVData>(csvText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const cleanData = results.data.filter((row): row is EVData => 
              row?.Make != null && 
              row?.Model != null && 
              !Object.values(row).every(val => val === null)
            );
            
            setData(cleanData);
            setFilteredData(cleanData);
            calculateStats(cleanData);
            setLoading(false);
          },
          error: (error: Error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching CSV:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateStats = (csvData: EVData[]): void => {
    const stats: StatsData = {
      totalVehicles: csvData.length,
      uniqueMakes: new Set(csvData.map(row => row.Make)).size,
      uniqueModels: new Set(csvData.map(row => row.Model)).size,
      averageRange: 0
    };
    setStatsData(stats);
  };



  const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, bgColor }) => (
    <div className={`${bgColor} rounded-lg p-6 shadow-lg transition-transform hover:scale-105`}>
      <div className="flex items-center space-x-3">
        <Icon className="h-6 w-6 text-white" />
        <h3 className="text-white text-lg font-semibold">{title}</h3>
      </div>
      <p className="text-white text-3xl font-bold mt-2">{value.toLocaleString()}</p>
    </div>
  );

  const prepareChartData = () => {
    const makeCount: { [key: string]: number } = {};
    data.forEach(vehicle => {
      makeCount[vehicle.Make] = (makeCount[vehicle.Make] || 0) + 1;
    });
    
    return Object.entries(makeCount)
      .map(([make, count]) => ({
        make,
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getColumns : any = () => {
    if (data.length === 0) return [];
    
    return Object.keys(data[0]).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Electric Vehicle Analytics Dashboard</h1>
        <p className="text-gray-600">Comprehensive analysis and visualization of EV market data</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Car}
          title="Total Vehicles"
          value={statsData.totalVehicles}
          bgColor="bg-gradient-to-r from-blue-600 to-blue-700"
        />
        <StatCard
          icon={FileSpreadsheet}
          title="Unique Makes"
          value={statsData.uniqueMakes}
          bgColor="bg-gradient-to-r from-green-600 to-green-700"
        />
        <StatCard
          icon={BarChart3}
          title="Unique Models"
          value={statsData.uniqueModels}
          bgColor="bg-gradient-to-r from-purple-600 to-purple-700"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Vehicle Distribution by Make</h2>
        </div>
        <div className="h-[500px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={prepareChartData()} 
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="make" 
                angle={-45}
                textAnchor="end"
                height={70}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="count" 
                fill="#3b82f6"
                name="Number of Vehicles"
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Detailed Vehicle Data</h2>
        </div>
        
        <Table
          columns={getColumns()}
          dataSource={filteredData.map((item, index) => ({ ...item, key: index }))}
          pagination={{
            total: filteredData.length,
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total.toLocaleString()} items`,
            position: ['bottomRight'],
            className: 'pagination-custom'
          }}
          scroll={{ x: 'max-content' }}
          size="middle"
          bordered
          className="custom-table"
        />
      </div>
    </div>
  );
};

export default EVDashboard;