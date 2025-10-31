import { useState } from "react";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { ExpenseDashboard } from "@/components/ExpenseDashboard";
import { ExpenseChart } from "@/components/ExpenseChart";
// import WatchCard from "watch_app/WatchCard";
import { useEffect } from "react";
import {createClient} from '../utils/supabase/client'
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface Expense {
  id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  user_id: string;
  created_at?: string
}

const Index = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const user = useSelector((state:RootState) => state.user.user)

  const handleAddExpense = async (newExpense: Omit<Expense, 'id'>) => {
    const expense: Omit<Expense, 'id'> = {
      ...newExpense,
      user_id: user.id
    };

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()

    // console.log('Expenses', expense, data, error)
    setExpenses(prev => [expense, ...prev]);
  };

  const handleUpdateExpense = async (id: string, updatedExpense: Omit<Expense, 'id'>) => {
    setExpenses(prev => prev.map(expense =>
      expense.id === id ? { ...updatedExpense, id } : expense
    ));
    const supabase = await createClient()

    const { data, error } = await supabase
    .from('expenses')
    .update({...updatedExpense})
    .eq('id', id)
    // .select()
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
  async function getExpenses() {
    const supabase = await createClient()

    // console.log(user.id)
    const { data } = await supabase.from("expenses").select().eq('user_id', user.id);
    // console.log(data);
    setExpenses(data);
  }

  useEffect(() => {
    if(user.id) {
      getExpenses();
    }
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard Stats */}
      <ExpenseDashboard expenses={expenses} />

      {/* Expense Chart */}
    
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

        {/* <div>
          <WatchCard />
        </div> */}

        {/* Expense List */}
        <div>
          <ExpenseList
            expenses={expenses}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        </div>
      </div>
      <div className="mt-8">
        <ExpenseChart expenses={expenses} />
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>Track your spending and stay on budget</p>
      </footer>
    </div>
  );
};

export default Index;