import { useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseDashboard } from "@/components/ExpenseDashboard";
import { ExpenseChart } from "@/components/ExpenseChart";
import { Wallet } from "lucide-react";

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    const expense: Expense = {
      ...newExpense,
      id: Date.now().toString()
    };
    setExpenses(prev => [expense, ...prev]);
  };

  const handleUpdateExpense = (id: string, updatedExpense: Omit<Expense, 'id'>) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...updatedExpense, id } : expense
    ));
    setEditingExpense(null);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const handleCancelEdit = () => {
    setEditingExpense(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">ExpenseTracker</h1>
              <p className="text-sm text-muted-foreground">Manage your expenses with ease</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Dashboard Stats */}
        <ExpenseDashboard expenses={expenses} />

        {/* Expense Chart */}
        <div className="mb-8">
          <ExpenseChart expenses={expenses} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Expense Form */}
          <div>
            <ExpenseForm 
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              editingExpense={editingExpense}
              onCancelEdit={handleCancelEdit}
            />
          </div>

          {/* Expense List */}
          <div>
            <ExpenseList 
              expenses={expenses}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Track your spending and stay on budget</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;