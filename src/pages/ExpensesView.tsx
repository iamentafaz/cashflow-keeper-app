import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Filter, Calendar, DollarSign } from 'lucide-react';

// Mock data for demonstration
const mockExpenses = [
  { id: 1, amount: 45.50, description: 'Grocery shopping', date: '2024-01-15', category: 'Food' },
  { id: 2, amount: 120.00, description: 'Gas bill', date: '2024-01-14', category: 'Utilities' },
  { id: 3, amount: 25.99, description: 'Coffee with friends', date: '2024-01-13', category: 'Entertainment' },
  { id: 4, amount: 89.99, description: 'Monthly gym membership', date: '2024-01-12', category: 'Health' },
  { id: 5, amount: 15.75, description: 'Bus ticket', date: '2024-01-11', category: 'Transport' },
  { id: 6, amount: 250.00, description: 'Phone bill', date: '2024-01-10', category: 'Utilities' },
  { id: 7, amount: 67.30, description: 'Restaurant dinner', date: '2024-01-09', category: 'Food' },
  { id: 8, amount: 199.99, description: 'Online course', date: '2024-01-08', category: 'Education' },
  { id: 9, amount: 35.00, description: 'Movie tickets', date: '2024-01-07', category: 'Entertainment' },
  { id: 10, amount: 78.45, description: 'Supermarket', date: '2024-01-06', category: 'Food' },
  { id: 11, amount: 12.50, description: 'Magazine subscription', date: '2024-01-05', category: 'Entertainment' },
  { id: 12, amount: 156.00, description: 'Car maintenance', date: '2024-01-04', category: 'Transport' },
];

const categories = ['All', 'Food', 'Utilities', 'Entertainment', 'Health', 'Transport', 'Education'];

const categoryColors = {
  Food: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Utilities: 'bg-blue-100 text-blue-800 border-blue-200',
  Entertainment: 'bg-purple-100 text-purple-800 border-purple-200',
  Health: 'bg-red-100 text-red-800 border-red-200',
  Transport: 'bg-orange-100 text-orange-800 border-orange-200',
  Education: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export default function ExpensesView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter and search logic
  const filteredExpenses = useMemo(() => {
    return mockExpenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.amount.toString().includes(searchTerm);
      const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Pagination logic
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Daily Expenses</h1>
          <p className="text-muted-foreground">Track and manage your daily expenses</p>
        </div>

        {/* Filters Card */}
        <Card className="border-elegant shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by description or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Category Filter */}
              <div className="w-full md:w-48">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedExpenses.length} of {filteredExpenses.length} expenses
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Total: {formatCurrency(filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0))}
          </div>
        </div>

        {/* Expenses Table */}
        <Card className="border-elegant shadow-elegant">
          <CardContent className="p-0">
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No data available</h3>
                <p className="text-muted-foreground max-w-sm">
                  {searchTerm || selectedCategory !== 'All' 
                    ? "No expenses match your current filters. Try adjusting your search or category filter."
                    : "You haven't recorded any expenses yet. Start tracking your daily expenses to see them here."
                  }
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-semibold">Date</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedExpenses.map((expense) => (
                      <TableRow key={expense.id} className="group">
                        <TableCell className="font-medium">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate group-hover:text-primary transition-colors">
                            {expense.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={categoryColors[expense.category as keyof typeof categoryColors]}
                          >
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="border-t p-4">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1;
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}