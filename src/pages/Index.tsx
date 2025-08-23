import { useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseDashboard } from "@/components/ExpenseDashboard";
import { ExpenseChart } from "@/components/ExpenseChart";
import WatchCard from "watch_app/WatchCard";
import { createClient } from "@supabase/supabase-js";
import { useEffect } from "react";
import getLoggedInUser from "@/utils/user";
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

interface Expense {
  id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  user_id?: string;
}

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const user = getLoggedInUser()
  console.log('user', user)

  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    const expense: Expense = {
      ...newExpense,
      user_id: user.id
      // id: Date.now().toString()
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()

    console.log('Expenses', expense, data, error)
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
  async function getInstruments() {
    console.log(user.id)
    const { data } = await supabase.from("expenses").select().eq('user_id', user.id);
    console.log(data);
    setExpenses(data);
  }

  useEffect(() => {
    getInstruments();
  }, []);

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