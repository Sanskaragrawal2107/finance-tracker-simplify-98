import React, { useState } from 'react';
import PageTitle from '@/components/common/PageTitle';
import { Button } from '@/components/ui/button';
import { Plus, FileText, DollarSign, ArrowDownCircle, ArrowUpCircle, Check, X, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomCard from '@/components/ui/CustomCard';
import { HeadOfficeTransaction } from '@/lib/types';

const sampleTransactions: HeadOfficeTransaction[] = [
  {
    id: '1',
    date: new Date('2023-04-01'),
    amount: 250000,
    description: 'Funds transfer to Project A',
    type: 'funds',
    status: 'completed',
    reference: 'FT123456',
    createdAt: new Date('2023-04-01'),
    supervisorName: 'John Doe'
  },
  {
    id: '2',
    date: new Date('2023-04-03'),
    amount: 120000,
    description: 'Funds transfer to Project B',
    type: 'funds',
    status: 'completed',
    reference: 'FT123457',
    createdAt: new Date('2023-04-03'),
    supervisorName: 'Jane Smith'
  },
  {
    id: '3',
    date: new Date('2023-04-05'),
    amount: 80000,
    description: 'Invoice payment - Steel Supplier',
    type: 'invoice',
    status: 'pending',
    reference: 'INV987654',
    createdAt: new Date('2023-04-05'),
    supervisorName: 'Mike Johnson'
  },
  {
    id: '4',
    date: new Date('2023-04-07'),
    amount: 35000,
    description: 'Salary payment - Admin staff',
    type: 'payment',
    status: 'completed',
    reference: 'PAY456789',
    createdAt: new Date('2023-04-07'),
    supervisorName: 'Admin'
  },
  {
    id: '5',
    date: new Date('2023-04-10'),
    amount: 45000,
    description: 'Office rent payment',
    type: 'expense',
    status: 'completed',
    reference: 'EXP123987',
    createdAt: new Date('2023-04-10'),
    supervisorName: 'Admin'
  },
  {
    id: '6',
    date: new Date('2023-04-12'),
    amount: 180000,
    description: 'Funds received from Client X',
    type: 'income',
    status: 'completed',
    reference: 'INC789456',
    createdAt: new Date('2023-04-12'),
    supervisorName: 'Admin'
  }
];

const HeadOffice = () => {
  const [transactions, setTransactions] = useState<HeadOfficeTransaction[]>(sampleTransactions);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageTitle
        title="Head Office"
        subtitle="Manage overall financial transactions and monitor project funding"
        className="mb-4"
      />

      <div className="flex justify-between items-center">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="funds">Funds Transfer</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          {transactions.map((transaction) => (
            <CustomCard key={transaction.id} className="border-l-4 border-blue-500">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{transaction.description}</h3>
                  <p className="text-sm text-muted-foreground">
                    {transaction.date.toLocaleDateString()} - {transaction.type}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-xl ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.type === 'income' ? '+' : '-'} ₹{transaction.amount.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end space-x-2">
                    {transaction.status === 'completed' ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-green-500 text-sm">Completed</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-500" />
                        <span className="text-red-500 text-sm">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Reference: {transaction.reference}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supervisor: {transaction.supervisorName}
                </p>
              </div>
            </CustomCard>
          ))}
        </TabsContent>
        <TabsContent value="funds">
          {transactions
            .filter((transaction) => transaction.type === 'funds')
            .map((transaction) => (
              <CustomCard key={transaction.id} className="border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{transaction.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date.toLocaleDateString()} - {transaction.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-red-500">
                      - ₹{transaction.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end space-x-2">
                      {transaction.status === 'completed' ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 text-sm">Completed</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 text-sm">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Reference: {transaction.reference}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supervisor: {transaction.supervisorName}
                  </p>
                </div>
              </CustomCard>
            ))}
        </TabsContent>
        <TabsContent value="invoices">
          {transactions
            .filter((transaction) => transaction.type === 'invoice')
            .map((transaction) => (
              <CustomCard key={transaction.id} className="border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{transaction.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date.toLocaleDateString()} - {transaction.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-red-500">
                      - ₹{transaction.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end space-x-2">
                      {transaction.status === 'completed' ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 text-sm">Completed</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 text-sm">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Reference: {transaction.reference}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supervisor: {transaction.supervisorName}
                  </p>
                </div>
              </CustomCard>
            ))}
        </TabsContent>
        <TabsContent value="payments">
          {transactions
            .filter((transaction) => transaction.type === 'payment')
            .map((transaction) => (
              <CustomCard key={transaction.id} className="border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{transaction.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date.toLocaleDateString()} - {transaction.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-red-500">
                      - ₹{transaction.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end space-x-2">
                      {transaction.status === 'completed' ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 text-sm">Completed</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 text-sm">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Reference: {transaction.reference}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supervisor: {transaction.supervisorName}
                  </p>
                </div>
              </CustomCard>
            ))}
        </TabsContent>
        <TabsContent value="expenses">
          {transactions
            .filter((transaction) => transaction.type === 'expense')
            .map((transaction) => (
              <CustomCard key={transaction.id} className="border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{transaction.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date.toLocaleDateString()} - {transaction.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-red-500">
                      - ₹{transaction.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end space-x-2">
                      {transaction.status === 'completed' ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 text-sm">Completed</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 text-sm">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Reference: {transaction.reference}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supervisor: {transaction.supervisorName}
                  </p>
                </div>
              </CustomCard>
            ))}
        </TabsContent>
        <TabsContent value="income">
          {transactions
            .filter((transaction) => transaction.type === 'income')
            .map((transaction) => (
              <CustomCard key={transaction.id} className="border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{transaction.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date.toLocaleDateString()} - {transaction.type}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-green-500">
                      + ₹{transaction.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center justify-end space-x-2">
                      {transaction.status === 'completed' ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 text-sm">Completed</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 text-sm">Pending</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Reference: {transaction.reference}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supervisor: {transaction.supervisorName}
                  </p>
                </div>
              </CustomCard>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HeadOffice;
