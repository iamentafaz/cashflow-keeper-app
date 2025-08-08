import { useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseDashboard } from "@/components/ExpenseDashboard";
import { ExpenseChart } from "@/components/ExpenseChart";
import WatchCard from "watch_app/WatchCard";

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
    <div className="container mx-auto px-4 py-8">
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

        <div>
          <WatchCard />
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
    </div>
  );
};

export default Index;