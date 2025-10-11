import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction, 
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { useSettings } from "@/hooks/use-settings";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bidBalance: number;
  role: string;
  createdAt: string;
  lastLogin?: string;
  totalBids: number;
  wonAuctions: number;
  totalSpent: number;
  ipAddress?: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UserActivity {
  activeBids: Array<{
    id: string;
    auctionId: string;
    auctionTitle: string;
    currentPrice: string;
    bidAmount: string;
    createdAt: string;
    status: string;
    bidCount: number;
  }>;
  prebids: Array<{
    id: string;
    auctionId: string;
    auctionTitle: string;
    amount: string;
    createdAt: string;
    status: string;
  }>;
  wonAuctions: Array<{
    id: string;
    title: string;
    finalPrice: string;
    endTime: string | null;
  }>;
}

export default function AdminUsers() {
  const { isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "", 
    phone: "",
    bidBalance: 0,
    role: "user",
  });
  const [viewingUserActivity, setViewingUserActivity] = useState<User | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { formatCurrency } = useSettings();
  const limit = 10;

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      setLocation("/");
    }
  }, [isAdmin, isLoading, setLocation]);

  const { data: usersData, isLoading: usersLoading } = useQuery<UsersResponse>({
    queryKey: [`/api/admin/users?page=${currentPage}&limit=${limit}&search=${searchTerm}`],
    enabled: isAdmin,
  });

  const { data: todayRegistrationsData } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/users/today-registrations"],
    enabled: isAdmin,
  });

  const { data: userActivityData, isLoading: activityLoading } = useQuery<UserActivity>({
    queryKey: [`/api/admin/users/${viewingUserActivity?.id}/activity`],
    enabled: isAdmin && !!viewingUserActivity?.id,
  });

  // Mutations for edit and delete
  const editUserMutation = useMutation({
    mutationFn: (userData: { id: string } & typeof editFormData) => 
      apiRequest('PATCH', `/api/admin/users/${userData.id}`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users?page=${currentPage}&limit=${limit}&search=${searchTerm}`] });
      handleCloseEditDialog();
      toast({
        title: t("success"),
        description: t("userUpdated"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("userUpdateError"),
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => 
      apiRequest('DELETE', `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users?page=${currentPage}&limit=${limit}&search=${searchTerm}`] });
      toast({
        title: t("success"),
        description: t("userDeleted"),
      });
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("userDeleteError"),
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phone: user.phone || "",
      bidBalance: user.bidBalance,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingUser) {
      editUserMutation.mutate({
        id: editingUser.id,
        ...editFormData,
        bidBalance: editFormData.bidBalance,
      });
    }
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingUser(null);
    setEditFormData({
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      bidBalance: 0,
      role: "user",
    });
  };

  const handleViewActivity = (user: User) => {
    setViewingUserActivity(user);
    setIsActivityDialogOpen(true);
  };

  const handleCloseActivityDialog = () => {
    setIsActivityDialogOpen(false);
    setViewingUserActivity(null);
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return <Badge className="bg-red-100 text-red-800">Админ</Badge>;
    }
    return <Badge variant="secondary">Пользователь</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-[1504px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="ghost" className="flex items-center space-x-2">
                <i className="fas fa-arrow-left"></i>
                <span>Назад</span>
              </Button>
            </Link>
            <div className="text-sm text-gray-500">
              <Link href="/admin" className="hover:text-gray-900">Панель администратора</Link>
              <i className="fas fa-chevron-right mx-2"></i>
              <span className="text-gray-900 font-medium">Управление пользователями</span>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            <i className="fas fa-users text-blue-500 mr-3"></i>
            Управление пользователями
          </h1>
          <p className="text-gray-600 mt-2">
            Просмотр и управление всеми пользователями системы
          </p>
        </div>

        {/* Stats Cards */}
        {usersData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <i className="fas fa-users text-blue-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Всего пользователей</p>
                    <p className="text-2xl font-bold text-gray-900">{usersData.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <i className="fas fa-user-plus text-green-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Активных</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {usersData.users.filter(u => u.totalBids > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <i className="fas fa-crown text-purple-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Админов</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {usersData.users.filter(u => u.role === 'admin').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <i className="fas fa-calendar-plus text-yellow-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Сегодня зарегистрировано</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {todayRegistrationsData?.count || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      новых пользователей
                    </p>
                  </div>
                </div>
              </CardContent>  
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-search text-gray-500"></i>
              <span>Поиск пользователей</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Поиск по имени пользователя, email или имени..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSearchTerm("");
                }}
                variant="outline"
                disabled={!searchTerm}
              >
                <i className="fas fa-times mr-2"></i>
                Очистить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600">Загрузка пользователей...</span>
              </div>
            ) : usersData?.users.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-users text-gray-300 text-4xl mb-4"></i>
                <p className="text-gray-500">Пользователи не найдены</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Пользователь</TableHead>
                        <TableHead>Контакты</TableHead>
                        <TableHead>IP адрес</TableHead>
                        <TableHead>Биды</TableHead>
                        <TableHead>Статистика</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead>Регистрация</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
                                <i className="fas fa-user text-sm"></i>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{user.username}</p>
                                <p className="text-sm text-gray-500">
                                  {user.firstName} {user.lastName}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-gray-900">{user.email}</p>
                              <p className="text-gray-500">{user.phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600 font-mono">
                              {user.ipAddress || "Не записан"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-green-600">
                              {user.bidBalance} бидов
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="text-gray-900">Ставок: {user.totalBids}</p>
                              <p className="text-gray-500">Выиграно: {user.wonAuctions}</p>
                              <p className="text-gray-500">Потрачено: {parseFloat(user.totalSpent.toString()).toFixed(2)} сом</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(user.role)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500">
                              {formatDate(user.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewActivity(user)}
                                title="Активность пользователя"
                              >
                                <i className="fas fa-chart-line"></i>
                              </Button>
                              <Dialog open={isEditDialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                                if (!open) handleCloseEditDialog();
                              }}>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                    title="Изменить пользователя"
                                  >
                                    <i className="fas fa-edit"></i>
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Редактировать пользователя</DialogTitle>
                                    <DialogDescription>
                                      Изменить информацию и настройки пользователя
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="username">Имя пользователя</Label>
                                        <Input
                                          id="username"
                                          value={editFormData.username}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setEditFormData(prev => ({ ...prev, username: e.target.value }));
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="role">Роль</Label>
                                        <select
                                          id="role"
                                          value={editFormData.role}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setEditFormData(prev => ({ ...prev, role: e.target.value }));
                                          }}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                          <option value="user">Пользователь</option>
                                          <option value="admin">Админ</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="firstName">Имя</Label>
                                        <Input
                                          id="firstName"
                                          value={editFormData.firstName}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setEditFormData(prev => ({ ...prev, firstName: e.target.value }));
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="lastName">Фамилия</Label>
                                        <Input
                                          id="lastName"
                                          value={editFormData.lastName}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setEditFormData(prev => ({ ...prev, lastName: e.target.value }));
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label htmlFor="email">Email</Label>
                                      <Input
                                        id="email"
                                        type="email"
                                        value={editFormData.email}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          setEditFormData(prev => ({ ...prev, email: e.target.value }));
                                        }}
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="phone">Телефон</Label>
                                        <Input
                                          id="phone"
                                          value={editFormData.phone}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setEditFormData(prev => ({ ...prev, phone: e.target.value }));
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="bidBalance">Биды</Label>
                                        <Input
                                          id="bidBalance"
                                          type="number"
                                          value={editFormData.bidBalance}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setEditFormData(prev => ({ ...prev, bidBalance: parseInt(e.target.value) || 0 }));
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={handleCloseEditDialog}>
                                      Отмена
                                    </Button>
                                    <Button 
                                      onClick={handleSaveEdit}
                                      disabled={editUserMutation.isPending}
                                    >
                                      {editUserMutation.isPending ? "Сохранение..." : "Сохранить"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700"
                                    title="Удалить пользователя"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Это действие нельзя отменить. Пользователь {user.username} будет удален навсегда.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                      disabled={deleteUserMutation.isPending}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {deleteUserMutation.isPending ? "Удаление..." : "Удалить"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {usersData && usersData.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Показано {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, usersData.total)} из {usersData.total} пользователей
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        <i className="fas fa-chevron-left mr-2"></i>
                        Предыдущая
                      </Button>
                      
                      {Array.from({ length: usersData.totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === usersData.totalPages || 
                          Math.abs(page - currentPage) <= 2
                        )
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-gray-500">...</span>
                            )}
                            <Button
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === usersData.totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Следующая
                        <i className="fas fa-chevron-right ml-2"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* User Activity Dialog */}
        <Dialog open={isActivityDialogOpen} onOpenChange={handleCloseActivityDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <i className="fas fa-chart-line text-blue-500"></i>
                <span>Активность пользователя: {viewingUserActivity?.username}</span>
              </DialogTitle>
              <DialogDescription>
                История ставок, пребидов и выигранных аукционов
              </DialogDescription>
            </DialogHeader>
            
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600">Загрузка активности...</span>
              </div>
            ) : userActivityData ? (
              <div className="space-y-6">
                {/* Won Auctions */}
                {userActivityData.wonAuctions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-green-600 mb-3">
                      <i className="fas fa-trophy mr-2"></i>
                      Выигранные аукционы ({userActivityData.wonAuctions.length})
                    </h3>
                    <div className="space-y-2">
                      {userActivityData.wonAuctions.map((auction) => (
                        <div key={auction.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-green-800">{auction.title}</p>
                              <p className="text-sm text-green-600">
                                Итоговая цена: {formatCurrency(parseFloat(auction.finalPrice))}
                              </p>
                            </div>
                            <span className="text-xs text-green-500">
                              {auction.endTime ? formatDate(auction.endTime) : 'Дата неизвестна'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active Bids */}
                {userActivityData.activeBids.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600 mb-3">
                      <i className="fas fa-gavel mr-2"></i>
                      Ставки ({userActivityData.activeBids.length})
                    </h3>
                    <div className="space-y-2">
                      {userActivityData.activeBids.map((bid) => (
                        <div key={bid.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-blue-800">{bid.auctionTitle}</p>
                              <p className="text-sm text-blue-600">
                                Потрачено: {bid.bidCount} {bid.bidCount === 1 ? 'бид' : 'бидов'} ({(bid.bidCount * 0.01).toFixed(2)} сом)
                              </p>
                              <p className="text-sm text-blue-600">
                                Текущая цена: {formatCurrency(parseFloat(bid.currentPrice))}
                              </p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                bid.status === 'live' ? 'bg-green-100 text-green-800' :
                                bid.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {bid.status === 'live' ? 'Активный' :
                                 bid.status === 'upcoming' ? 'Предстоящий' : 'Завершен'}
                              </span>
                            </div>
                            <span className="text-xs text-blue-500">
                              {formatDate(bid.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Prebids */}
                {userActivityData.prebids.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-purple-600 mb-3">
                      <i className="fas fa-clock mr-2"></i>
                      Пребиды ({userActivityData.prebids.length})
                    </h3>
                    <div className="space-y-2">
                      {userActivityData.prebids.map((prebid) => (
                        <div key={prebid.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-purple-800">{prebid.auctionTitle}</p>
                              <p className="text-sm text-purple-600">
                                Потрачено: 1 бид (0.01 сом)
                              </p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                prebid.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                                prebid.status === 'live' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {prebid.status === 'upcoming' ? 'Ожидает начала' :
                                 prebid.status === 'live' ? 'Конвертирован в ставку' : 'Завершен'}
                              </span>
                            </div>
                            <span className="text-xs text-purple-500">
                              {formatDate(prebid.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Activity */}
                {userActivityData.activeBids.length === 0 && 
                 userActivityData.prebids.length === 0 && 
                 userActivityData.wonAuctions.length === 0 && (
                  <div className="text-center py-8">
                    <i className="fas fa-inbox text-gray-300 text-4xl mb-4"></i>
                    <p className="text-gray-500">У пользователя нет активности в аукционах</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="fas fa-exclamation-triangle text-yellow-300 text-4xl mb-4"></i>
                <p className="text-gray-500">Не удалось загрузить данные о активности</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}