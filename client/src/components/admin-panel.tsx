import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";
import type { BotSettings, Auction, Bot, AuctionBot } from "@/types/auction";

// Name data for bot generator
const MALE_NAMES = [
  "Aibek Toktomamatov", "Bakytbek Ismailov", "Cholponbek Kudaiberdiev", "Emilbek Abdykadyrov",
  "Ruslan Joldoshov", "Talantbek Bektursunov", "Ermek Sadykov", "Adilet Toktogulov",
  "Zhyldyzbek Nurgaziev", "Omurbek Abylov", "Nursultan Orozbaev", "Kubanychbek Uulu",
  "Maratbek Kurmanov", "Ulanbek Sulaimanov", "Nurlanbek Abdirasulov", "Maksat Sydykov",
  "Tilekbek Ryskulov", "Daniyar Eraliev", "Bekzat Asanov", "Zamirbek Kozhoev",
  "Mirbek Almazbekov", "Bakai Kalykov", "Kanybek Satybaldiev", "Kanatbek Mamytov",
  "Aibek Joldoshbekov", "Taalaybek Usubaliev", "Erbolat Amanbaev", "Adisbek Turgunov",
  "Zholoman Isakbaev", "Almazbek Nurmatov", "Marlen Sulaimanov", "Beksultan Askarov",
  "Ruslanbek Tashiev", "Nursultan Tynaliev", "Talant Ulanov", "Alisher Ibragimov",
  "Nurislam Ashyrbekov", "Ermekbek Kadyrov", "Azamat Usubov", "Nursultan Akmatov",
  "Dastanbek Kudaibergenov", "Zhyldyzbek Karypbekov", "Ulanbek Turgunaliev", "Almaz Kenzhebekov",
  "Nurbolot Omuraliev", "Tilek Abdyldaev", "Asylbek Tokonov", "Elmarbek Saparaliev",
  "Ruslanbek Abdyldaev", "Tologonbek Kalykov"
];

const FEMALE_NAMES = [
  "Damira Satybaldieva", "Farida Toktosunova", "Gulmira Asanbekova", "Aizada Mamytova",
  "Meerim Kenzhebekova", "Ainura Imanalieva", "Saltanat Osmonalieva", "Jyldyz Sheralieva",
  "Baktygul Turgunbaeva", "Dilbara Mambetova", "Aizada Saparova", "Ayzirek Omurbekova",
  "Nargiza Turgunova", "Aigul Berdibaeva", "Gulzada Moldogazieva", "Ryskul Orozalieva",
  "Nurgul Kadyralieva", "Elzat Tynalieva", "Nazira Toktomamatova", "Aziza Japarova",
  "Ainura Alimkhanova", "Meerim Beishekeeva", "Gulnara Abdurakhmanova", "Saadat Kenzhebaeva",
  "Cholpon Tashmatova", "Ayana Erkinbaeva", "Bibisara Amanalieva", "Jibek Sharsheeva",
  "Aiganysh Kurbanalieva", "Elmira Toktogazieva", "Aisuluu Dzhumabekova", "Gulmira Sulaimanova",
  "Aigerim Matkerimova", "Kunduz Saparalieva", "Nazgul Amanbekova", "Jyldyz Orozova",
  "Zamira Baibolova", "Anara Nogoibaeva", "Saltanat Tashmatova", "Ainagul Isaeva",
  "Baktygul Jorobekova", "Dilnura Matkasymova", "Nuraiym Almazbekova", "Zhypara Ermekova",
  "Nazira Kenzhebaeva", "Aigul Toktobaeva", "Damira Amanalieva", "Meerim Sadykova",
  "Bibigul Karypbekova", "Bermet Kadyrova"
];

export function AdminPanel() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();

  const [editingAuction, setEditingAuction] = useState<Auction | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBotDialogOpen, setIsBotDialogOpen] = useState(false);
  const [isAuctionBotDialogOpen, setIsAuctionBotDialogOpen] = useState(false);
  const [selectedAuctionForBots, setSelectedAuctionForBots] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const auctionsPerPage = 10;
  const [botCurrentPage, setBotCurrentPage] = useState(1);
  const botsPerPage = 5;

  const { data: botSettings } = useQuery<BotSettings>({
    queryKey: ["/api/admin/bot-settings"],
  });

  const { data: allAuctions = [] } = useQuery<Auction[]>({
    queryKey: ["/api/admin/auctions"],
  });

  const { data: allBots = [] } = useQuery<Bot[]>({
    queryKey: ["/api/admin/bots"],
  });

  const { data: auctionBots = [] } = useQuery<AuctionBot[]>({
    queryKey: ["/api/admin/auctions", selectedAuctionForBots, "bots"],
    enabled: !!selectedAuctionForBots,
  });

  // Query to get all bots with their auction associations to show conflicts
  const { data: allBotsWithAuctions = [] } = useQuery({
    queryKey: ["/api/admin/bots/auction-status"],
    enabled: isEditDialogOpen || isAuctionBotDialogOpen,
  });

  const botSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<BotSettings>) => {
      const response = await apiRequest("PUT", "/api/admin/bot-settings", settings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("botSettingsSaved"),
        description: t("botSettingsUpdated"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bot-settings"] });
    },
  });

  // **FIX #2: Initialize with default start time (now + 10 minutes)**
  const [newAuction, setNewAuction] = useState({
    title: "",
    description: "",
    imageUrl: "",
    retailPrice: "",
    startTime: "", // Will be set to default when dialog opens
    isBidPackage: false,
  });

  const [newBot, setNewBot] = useState({
    username: "",
    firstName: "",
    lastName: "",
    isActive: true,
  });

  const [auctionBotData, setAuctionBotData] = useState({
    botId: "",
    bidLimit: 0,
  });

  // Bot name generator function
  const generateBotName = (gender: 'male' | 'female') => {
    const names = gender === 'male' ? MALE_NAMES : FEMALE_NAMES;
    const randomName = names[Math.floor(Math.random() * names.length)];
    const [firstName, lastName] = randomName.split(' ');
    
    // Generate unique username - just first name without digits (like cholpon)
    const username = firstName.toLowerCase();
    
    setNewBot({
      username: username,
      firstName: firstName,
      lastName: lastName,
      isActive: true,
    });
  };

  const createAuctionMutation = useMutation({
    mutationFn: async (auctionData: any) => {
      const response = await apiRequest("POST", "/api/admin/auctions", auctionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Аукцион создан",
        description: "Новый аукцион успешно создан",
      });
      setNewAuction({
        title: "",
        description: "",
        imageUrl: "",
        retailPrice: "",
        startTime: "",
        isBidPackage: false,
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    },
  });

  const createBotMutation = useMutation({
    mutationFn: async (botData: any) => {
      const response = await apiRequest("POST", "/api/admin/bots", botData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Бот создан",
        description: "Новый бот успешно создан",
      });
      setNewBot({
        username: "",
        firstName: "",
        lastName: "",
        isActive: true,
      });
      setIsBotDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bots"] });
    },
  });

  const deleteBotMutation = useMutation({
    mutationFn: async (botId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/bots/${botId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Бот удален",
        description: "Бот успешно удален",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bots"] });
    },
  });

  const addBotToAuctionMutation = useMutation({
    mutationFn: async ({ auctionId, botId, bidLimit }: { auctionId: string; botId: string; bidLimit: number }) => {
      const response = await apiRequest("POST", `/api/admin/auctions/${auctionId}/bots`, { botId, bidLimit });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Бот добавлен",
        description: "Бот успешно добавлен в аукцион",
      });
      setAuctionBotData({ botId: "", bidLimit: 0 });
      setIsAuctionBotDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auctions", selectedAuctionForBots, "bots"] });
    },
  });

  const removeBotFromAuctionMutation = useMutation({
    mutationFn: async ({ auctionId, botId }: { auctionId: string; botId: string }) => {
      const response = await apiRequest("DELETE", `/api/admin/auctions/${auctionId}/bots/${botId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Бот удален из аукциона",
        description: "Бот успешно удален из аукциона",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auctions", selectedAuctionForBots, "bots"] });
    },
  });

  const updateAuctionMutation = useMutation({
    mutationFn: async (data: { id: string; auctionData: any }) => {
      const response = await apiRequest("PUT", `/api/admin/auctions/${data.id}`, data.auctionData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Аукцион обновлен",
        description: "Данные аукциона успешно обновлены",
      });
      setEditingAuction(null);
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    },
  });

  const deleteAuctionMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Deleting auction with ID:", id);
      const response = await apiRequest("DELETE", `/api/admin/auctions/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete auction");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Аукцион удален",
        description: "Аукцион успешно удален",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    },
    onError: (error: Error) => {
      console.error("Delete auction error:", error);
      toast({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить аукцион",
        variant: "destructive",
      });
    },
  });

  const endAuctionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/admin/auctions/${id}/end`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Аукцион завершен",
        description: "Аукцион успешно завершен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
    },
  });

  const handleBotSettingsUpdate = (field: keyof BotSettings, value: any) => {
    if (!botSettings) return;

    const updatedSettings = { [field]: value };
    botSettingsMutation.mutate(updatedSettings);
  };

  const handleCreateAuction = () => {
    if (!newAuction.title || !newAuction.retailPrice || !newAuction.startTime) {
      toast({
        title: "Ошибка валидации",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    // **FIX #2: Frontend validation - check if start time is in the past**
    const startTime = new Date(newAuction.startTime);
    const now = new Date();
    const gracePeriod = 30 * 1000; // 30 seconds grace period
    
    if (startTime.getTime() < (now.getTime() - gracePeriod)) {
      toast({
        title: "Ошибка валидации",
        description: "Время начала не может быть в прошлом. Пожалуйста, выберите будущее время.",
        variant: "destructive",
      });
      return;
    }

    createAuctionMutation.mutate({
      title: newAuction.title,
      description: newAuction.description,
      imageUrl: newAuction.imageUrl,
      retailPrice: parseFloat(newAuction.retailPrice),
      startTime: newAuction.startTime,
      isBidPackage: newAuction.isBidPackage,
    });
  };

  const handleCreateBot = () => {
    if (!newBot.firstName || !newBot.lastName) {
      toast({
        title: "Ошибка валидации",
        description: "Заполните имя и фамилию бота",
        variant: "destructive",
      });
      return;
    }

    createBotMutation.mutate(newBot);
  };

  const handleAddBotToAuction = () => {
    if (!auctionBotData.botId || !selectedAuctionForBots) {
      toast({
        title: "Ошибка валидации",
        description: "Выберите бота и аукцион",
        variant: "destructive",
      });
      return;
    }

    addBotToAuctionMutation.mutate({
      auctionId: selectedAuctionForBots,
      botId: auctionBotData.botId,
      bidLimit: auctionBotData.bidLimit,
    });
  };

  const handleEditAuction = (auction: Auction) => {
    setEditingAuction(auction);
    setSelectedAuctionForBots(auction.id); // Load bots for this auction
    setIsEditDialogOpen(true);
  };

  const handleUpdateAuction = () => {
    if (!editingAuction) return;

    updateAuctionMutation.mutate({
      id: editingAuction.id,
      auctionData: {
        title: editingAuction.title,
        description: editingAuction.description,
        imageUrl: editingAuction.imageUrl,
        retailPrice: typeof editingAuction.retailPrice === 'string' ? parseFloat(editingAuction.retailPrice) : editingAuction.retailPrice,
        startTime: editingAuction.startTime,
      },
    });
  };

  const handleDeleteAuction = (id: string) => {
    if (confirm("Вы уверены, что хотите удалить этот аукцион?")) {
      deleteAuctionMutation.mutate(id);
    }
  };

  const handleEndAuction = (id: string) => {
    if (confirm("Вы уверены, что хотите завершить этот аукцион?")) {
      endAuctionMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      upcoming: { label: "Предстоящий", variant: "secondary" as const },
      live: { label: "Активный", variant: "destructive" as const },
      finished: { label: "Завершен", variant: "default" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.upcoming;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('ru-RU');
  };

  // **FIX #2: Helper to get default start time (now + 10 minutes)**
  const getDefaultStartTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10); // Add 10 minutes
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-6">
      {/* Admin Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-tachometer-alt mr-2"></i>
            Навигация
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex items-center justify-center h-16 text-left"
              onClick={() => window.location.href = '/admin/users'}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <i className="fas fa-users text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p className="font-medium">Пользователи</p>
                  <p className="text-sm text-gray-500">Управление пользователями</p>
                </div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="flex items-center justify-center h-16 text-left"
              onClick={() => window.location.href = '/admin/finished-auctions'}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <i className="fas fa-trophy text-yellow-600 text-xl"></i>
                </div>
                <div>
                  <p className="font-medium">Завершенные аукционы</p>
                  <p className="text-sm text-gray-500">Просмотр результатов</p>
                </div>
              </div>
            </Button>
            
            <div className="flex items-center justify-center h-16 p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <i className="fas fa-gavel text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="font-medium text-green-600">Аукционы</p>
                  <p className="text-sm text-gray-500">Текущая страница</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center h-16 p-4 border-2 border-dashed border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <i className="fas fa-robot text-purple-600 text-xl"></i>
                </div>
                <div>
                  <p className="font-medium text-gray-400">Боты</p>
                  <p className="text-sm text-gray-400">Ниже на странице</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auction Management Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <i className="fas fa-gavel mr-2"></i>
              Управление аукционами
            </CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              // **FIX #2: Set default start time when dialog opens**
              if (open && !newAuction.startTime) {
                setNewAuction(prev => ({ ...prev, startTime: getDefaultStartTime() }));
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <i className="fas fa-plus mr-2"></i>
                  Создать аукцион
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Создать новый аукцион</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Название товара</Label>
                    <Input
                      id="title"
                      value={newAuction.title}
                      onChange={(e) => setNewAuction({ ...newAuction, title: e.target.value })}
                      placeholder="iPhone 15 Pro 128GB"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={newAuction.description}
                      onChange={(e) => setNewAuction({ ...newAuction, description: e.target.value })}
                      placeholder="Оригинал, запечатанный"
                      className="h-20"
                    />
                  </div>

                  <div>
                    <Label htmlFor="imageUrl">URL изображения</Label>
                    <Input
                      id="imageUrl"
                      value={newAuction.imageUrl}
                      onChange={(e) => setNewAuction({ ...newAuction, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="retailPrice">Розничная цена</Label>
                    <Input
                      id="retailPrice"
                      type="number"
                      value={newAuction.retailPrice}
                      onChange={(e) => setNewAuction({ ...newAuction, retailPrice: e.target.value })}
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="startTime">Время начала</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={newAuction.startTime}
                      onChange={(e) => setNewAuction({ ...newAuction, startTime: e.target.value })}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Время должно быть в будущем (рекомендуется +10 минут)
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isBidPackage"
                      checked={newAuction.isBidPackage}
                      onCheckedChange={(checked) => setNewAuction({ ...newAuction, isBidPackage: !!checked })}
                    />
                    <Label htmlFor="isBidPackage">Bid Package</Label>
                  </div>

                  <Button 
                    onClick={handleCreateAuction}
                    className="w-full"
                    disabled={createAuctionMutation.isPending}
                  >
                    {createAuctionMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Создание...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus mr-2"></i>
                        Создать аукцион
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Изображение</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Розничная цена</TableHead>
                  <TableHead>Время начала</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  const filteredAuctions = allAuctions
                    .filter(auction => auction.status !== "finished")
                    .sort((a, b) => {
                      // Live auctions first
                      if (a.status === "live" && b.status !== "live") return -1;
                      if (b.status === "live" && a.status !== "live") return 1;
                      
                      // Then upcoming auctions by nearest start time
                      if (a.status === "upcoming" && b.status === "upcoming") {
                        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                      }
                      
                      return 0;
                    });

                  const totalAuctions = filteredAuctions.length;
                  const totalPages = Math.ceil(totalAuctions / auctionsPerPage);
                  const startIndex = (currentPage - 1) * auctionsPerPage;
                  const endIndex = startIndex + auctionsPerPage;
                  const paginatedAuctions = filteredAuctions.slice(startIndex, endIndex);

                  if (totalAuctions === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Нет активных аукционов
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return paginatedAuctions.map((auction) => (
                    <TableRow key={auction.id}>
                      <TableCell>
                        <img
                          src={auction.imageUrl}
                          alt={auction.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{auction.title}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {auction.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(auction.status)}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(auction.currentPrice)}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatCurrency(auction.retailPrice)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDateTime(auction.startTime)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditAuction(auction)}
                            className="h-8 w-8 p-0"
                            title="Редактировать"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          {auction.status === 'live' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEndAuction(auction.id)}
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:border-orange-300"
                              title="Завершить"
                            >
                              <i className="fas fa-stop"></i>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAuction(auction.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:border-red-300"
                            title="Удалить"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {(() => {
            const filteredAuctions = allAuctions.filter(auction => auction.status !== "finished");
            const totalAuctions = filteredAuctions.length;
            const totalPages = Math.ceil(totalAuctions / auctionsPerPage);

            if (totalPages <= 1) return null;

            return (
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center text-sm text-gray-500">
                  <span>
                    Показано {Math.min((currentPage - 1) * auctionsPerPage + 1, totalAuctions)}-{Math.min(currentPage * auctionsPerPage, totalAuctions)} из {totalAuctions} аукционов
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <i className="fas fa-angle-double-left"></i>
                  </Button>
                  
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <i className="fas fa-angle-left"></i>
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-8 w-8 p-0 ${
                          currentPage === pageNum 
                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                            : ""
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm" 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <i className="fas fa-angle-right"></i>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <i className="fas fa-angle-double-right"></i>
                  </Button>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Bid Package Auctions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-gift mr-2"></i>
            Bid Package аукционы
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // Filter upcoming auctions with bid package enabled
            const bidPackageAuctions = allAuctions
              .filter(auction => auction.status === "upcoming" && auction.isBidPackage)
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

            if (bidPackageAuctions.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-gift text-4xl mb-4 opacity-50"></i>
                  <p>Нет предстоящих Bid Package аукционов</p>
                </div>
              );
            }

            return (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Изображение</TableHead>
                      <TableHead>Название</TableHead>
                      <TableHead>Розничная цена</TableHead>
                      <TableHead>Время начала</TableHead>
                      <TableHead>Пребиды</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bidPackageAuctions.map((auction) => (
                      <TableRow key={auction.id}>
                        <TableCell>
                          <img
                            src={auction.imageUrl}
                            alt={auction.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold flex items-center">
                              {auction.title}
                              <Badge variant="secondary" className="ml-2 text-xs">
                                <i className="fas fa-gift mr-1"></i>
                                Bid Package
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {auction.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatCurrency(auction.retailPrice)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(auction.startTime).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {auction.prebidsCount || 0} пребидов
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingAuction(auction);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Edit Auction Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать аукцион</DialogTitle>
          </DialogHeader>
          {editingAuction && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Название товара</Label>
                <Input
                  id="edit-title"
                  value={editingAuction.title}
                  onChange={(e) => setEditingAuction({ ...editingAuction, title: e.target.value })}
                  placeholder="iPhone 15 Pro 128GB"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Описание</Label>
                <Textarea
                  id="edit-description"
                  value={editingAuction.description}
                  onChange={(e) => setEditingAuction({ ...editingAuction, description: e.target.value })}
                  placeholder="Оригинал, запечатанный"
                  className="h-20"
                />
              </div>

              <div>
                <Label htmlFor="edit-imageUrl">URL изображения</Label>
                <Input
                  id="edit-imageUrl"
                  value={editingAuction.imageUrl}
                  onChange={(e) => setEditingAuction({ ...editingAuction, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="edit-retailPrice">Розничная цена</Label>
                <Input
                  id="edit-retailPrice"
                  type="number"
                  value={editingAuction.retailPrice}
                  onChange={(e) => setEditingAuction({ ...editingAuction, retailPrice: e.target.value })}
                  placeholder="50000"
                />
              </div>

              <div>
                <Label htmlFor="edit-startTime">Время начала</Label>
                <Input
                  id="edit-startTime"
                  type="datetime-local"
                  value={editingAuction.startTime ? new Date(editingAuction.startTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingAuction({ ...editingAuction, startTime: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Время должно быть в будущем
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isBidPackage"
                  checked={editingAuction.isBidPackage}
                  onCheckedChange={(checked) => setEditingAuction({ ...editingAuction, isBidPackage: !!checked })}
                />
                <Label htmlFor="edit-isBidPackage">Bid Package</Label>
              </div>

              {/* Bot Management for Auction */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <i className="fas fa-robot mr-2"></i>
                  Управление ботами
                </h4>
                
                {/* Current bots in auction */}
                <div className="mb-4">
                  <Label className="text-sm font-medium">Боты в аукционе:</Label>
                  {auctionBots.length === 0 ? (
                    <p className="text-sm text-gray-500 mt-1">Боты не назначены</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {auctionBots.map((auctionBot) => (
                        <div key={auctionBot.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <i className="fas fa-user text-white text-xs"></i>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {auctionBot.bot.firstName} {auctionBot.bot.lastName}
                              </span>
                              <span className="text-xs text-gray-500">@{auctionBot.bot.username}</span>
                            </div>
                            <Badge variant={auctionBot.isActive ? "default" : "secondary"} className="text-xs">
                              {auctionBot.isActive ? "Активен" : "Неактивен"}
                            </Badge>
                            <span className="text-xs text-gray-600">
                              {auctionBot.bidLimit > 0 ? (
                                <>Лимит: {auctionBot.bidLimit}/{auctionBot.currentBids}</>
                              ) : (
                                <>Ставок: {auctionBot.currentBids}</>
                              )}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 px-2 text-xs"
                            onClick={() => removeBotFromAuctionMutation.mutate({
                              auctionId: editingAuction.id,
                              botId: auctionBot.botId
                            })}
                            disabled={removeBotFromAuctionMutation.isPending}
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add new bot */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="editAuctionBot">Добавить бота</Label>
                    <Select
                      value={auctionBotData.botId}
                      onValueChange={(value) => setAuctionBotData({...auctionBotData, botId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите бота" />
                      </SelectTrigger>
                      <SelectContent>
                        {allBots.filter(bot => bot.isActive).map((bot) => {
                          // Check if bot is already in this auction
                          const isInCurrentAuction = auctionBots.some(ab => ab.botId === bot.id);
                          
                          // Check if bot is in other live auctions
                          const botWithStatus = allBotsWithAuctions.find(b => b.id === bot.id);
                          const otherLiveAuctions = botWithStatus?.currentAuctions?.filter(
                            auction => auction.auctionId !== editingAuction?.id
                          ) || [];
                          
                          return (
                            <SelectItem 
                              key={bot.id} 
                              value={bot.id}
                              disabled={isInCurrentAuction}
                            >
                              <div className="flex flex-col items-start w-full">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex flex-col">
                                    <span>{bot.firstName} {bot.lastName}</span>
                                    <span className="text-xs text-gray-500">@{bot.username}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    {isInCurrentAuction && (
                                      <Badge variant="secondary" className="text-xs">
                                        Уже добавлен
                                      </Badge>
                                    )}
                                    {otherLiveAuctions.length > 0 && (
                                      <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                                        В {otherLiveAuctions.length} других
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {otherLiveAuctions.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Активен в: {otherLiveAuctions.map(a => a.auctionTitle).join(', ')}
                                  </div>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="editBotLimit">Лимит ставок (0 = без лимита)</Label>
                    <Input
                      id="editBotLimit"
                      type="number"
                      min="0"
                      value={auctionBotData.bidLimit === 0 ? '' : auctionBotData.bidLimit}
                      onChange={(e) => setAuctionBotData({...auctionBotData, bidLimit: parseInt(e.target.value) || 0})}
                      placeholder="0 = без лимита"
                      className="w-full"
                    />
                  </div>
                  
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (auctionBotData.botId && editingAuction) {
                        addBotToAuctionMutation.mutate({
                          auctionId: editingAuction.id,
                          botId: auctionBotData.botId,
                          bidLimit: auctionBotData.bidLimit,
                        });
                      }
                    }}
                    disabled={!auctionBotData.botId || addBotToAuctionMutation.isPending}
                  >
                    {addBotToAuctionMutation.isPending ? "Добавление..." : "Добавить бота"}
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleUpdateAuction}
                className="w-full"
                disabled={updateAuctionMutation.isPending}
              >
                {updateAuctionMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Обновление...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Сохранить изменения
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bot Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-robot mr-2"></i>
              Управление ботами
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {botSettings && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="botsEnabled">Боты активны</Label>
                  <Switch
                    id="botsEnabled"
                    checked={botSettings?.enabled || false}
                    onCheckedChange={(checked) => handleBotSettingsUpdate("enabled", checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="minDelay">Минимальная задержка (сек)</Label>
                  <Input
                    id="minDelay"
                    type="number"
                    min="1"
                    max="10"
                    value={botSettings?.minDelay || 5}
                    onChange={(e) => handleBotSettingsUpdate("minDelay", parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="maxDelay">Максимальная задержка (сек)</Label>
                  <Input
                    id="maxDelay"
                    type="number"
                    min="1"
                    max="10"
                    value={botSettings?.maxDelay || 6}
                    onChange={(e) => handleBotSettingsUpdate("maxDelay", parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="activeBots">Количество активных ботов</Label>
                  <Select
                    value={botSettings?.activeBots?.toString() || "0"}
                    onValueChange={(value) => handleBotSettingsUpdate("activeBots", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "бот" : "ботов"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Individual Bot Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-robot mr-2"></i>
                Управление ботами
              </div>
              <Dialog open={isBotDialogOpen} onOpenChange={setIsBotDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <i className="fas fa-plus mr-2"></i>
                    Создать бота
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Создать нового бота</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Name Generator */}
                    <div className="flex flex-col space-y-3 p-4 bg-gray-50 rounded-lg border">
                      <Label className="text-sm font-medium">Генератор имен</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateBotName('male')}
                          className="flex items-center gap-2"
                        >
                          <i className="fas fa-male text-blue-600"></i>
                          Мужское имя
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => generateBotName('female')}
                          className="flex items-center gap-2"
                        >
                          <i className="fas fa-female text-pink-600"></i>
                          Женское имя
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600">Нажмите кнопку чтобы автоматически заполнить форму киргизским именем</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="botUsername">Имя пользователя</Label>
                      <Input
                        id="botUsername"
                        value={newBot.username}
                        onChange={(e) => setNewBot({...newBot, username: e.target.value})}
                        placeholder="aleksey_petrov"
                      />
                    </div>
                    <div>
                      <Label htmlFor="botFirstName">Имя</Label>
                      <Input
                        id="botFirstName"
                        value={newBot.firstName}
                        onChange={(e) => setNewBot({...newBot, firstName: e.target.value})}
                        placeholder="Алексей"
                      />
                    </div>
                    <div>
                      <Label htmlFor="botLastName">Фамилия</Label>
                      <Input
                        id="botLastName"
                        value={newBot.lastName}
                        onChange={(e) => setNewBot({...newBot, lastName: e.target.value})}
                        placeholder="Иванов"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="botActive">Активен</Label>
                      <Switch
                        id="botActive"
                        checked={newBot.isActive}
                        onCheckedChange={(checked) => setNewBot({...newBot, isActive: checked})}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsBotDialogOpen(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleCreateBot} disabled={createBotMutation.isPending}>
                        {createBotMutation.isPending ? "Создание..." : "Создать"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allBots.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Боты не созданы
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>В аукционах</TableHead>
                      <TableHead>Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const startIndex = (botCurrentPage - 1) * botsPerPage;
                      const endIndex = startIndex + botsPerPage;
                      const paginatedBots = allBots.slice(startIndex, endIndex);
                      
                      return paginatedBots.map((bot) => {
                        const botWithStatus = allBotsWithAuctions.find(b => b.id === bot.id);
                        const currentAuctions = botWithStatus?.currentAuctions || [];
                        
                        return (
                          <TableRow key={bot.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                  <i className="fas fa-user text-white text-sm"></i>
                                </div>
                                <div>
                                  <div className="font-medium">{bot.firstName} {bot.lastName}</div>
                                  <div className="text-xs text-gray-500">@{bot.username}</div>
                                  <div className="text-xs text-gray-400">
                                    Создан: {new Date(bot.createdAt).toLocaleDateString('ru-RU')}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={bot.isActive ? "default" : "secondary"}>
                                {bot.isActive ? "Активен" : "Неактивен"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {currentAuctions.length > 0 ? (
                                <div className="space-y-1">
                                  {currentAuctions.map((auction, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {auction.auctionTitle}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {auction.currentBids}/{auction.bidLimit || '∞'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">Не участвует</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteBotMutation.mutate(bot.id)}
                                disabled={deleteBotMutation.isPending}
                              >
                                <i className="fas fa-trash mr-1"></i>
                                Удалить
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              )}
              
              {/* Bot Pagination */}
              {allBots.length > botsPerPage && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-gray-600">
                    Показано {Math.min((botCurrentPage - 1) * botsPerPage + 1, allBots.length)}-{Math.min(botCurrentPage * botsPerPage, allBots.length)} из {allBots.length} ботов
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBotCurrentPage(1)}
                      disabled={botCurrentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <i className="fas fa-angle-double-left"></i>
                    </Button>
                    
                    <Button
                      variant="outline" 
                      size="sm"
                      onClick={() => setBotCurrentPage(botCurrentPage - 1)}
                      disabled={botCurrentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <i className="fas fa-angle-left"></i>
                    </Button>
                    
                    {(() => {
                      const totalBotPages = Math.ceil(allBots.length / botsPerPage);
                      return Array.from({ length: Math.min(5, totalBotPages) }, (_, i) => {
                        let pageNum;
                        if (totalBotPages <= 5) {
                          pageNum = i + 1;
                        } else if (botCurrentPage <= 3) {
                          pageNum = i + 1;
                        } else if (botCurrentPage >= totalBotPages - 2) {
                          pageNum = totalBotPages - 4 + i;
                        } else {
                          pageNum = botCurrentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={botCurrentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setBotCurrentPage(pageNum)}
                            className={`h-8 w-8 p-0 ${
                              botCurrentPage === pageNum 
                                ? "bg-blue-600 text-white hover:bg-blue-700" 
                                : ""
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      });
                    })()}
                    
                    <Button
                      variant="outline"
                      size="sm" 
                      onClick={() => setBotCurrentPage(botCurrentPage + 1)}
                      disabled={botCurrentPage === Math.ceil(allBots.length / botsPerPage)}
                      className="h-8 w-8 p-0"
                    >
                      <i className="fas fa-angle-right"></i>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBotCurrentPage(Math.ceil(allBots.length / botsPerPage))}
                      disabled={botCurrentPage === Math.ceil(allBots.length / botsPerPage)}
                      className="h-8 w-8 p-0"
                    >
                      <i className="fas fa-angle-double-right"></i>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Auction-Bot Associations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-link mr-2"></i>
              Боты в аукционах
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="auctionSelect">Выберите аукцион</Label>
                <Select value={selectedAuctionForBots} onValueChange={setSelectedAuctionForBots}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите аукцион" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAuctions.filter(auction => auction.status !== 'finished').map((auction) => (
                      <SelectItem key={auction.id} value={auction.id}>
                        {auction.title} - {auction.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAuctionForBots && (
                <>
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Боты в аукционе</h4>
                    <Dialog open={isAuctionBotDialogOpen} onOpenChange={setIsAuctionBotDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <i className="fas fa-plus mr-2"></i>
                          Добавить бота
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Добавить бота в аукцион</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="selectBot">Выберите бота</Label>
                            <Select value={auctionBotData.botId} onValueChange={(value) => setAuctionBotData({...auctionBotData, botId: value})}>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите бота" />
                              </SelectTrigger>
                              <SelectContent>
                                {allBots.filter(bot => bot.isActive).map((bot) => (
                                  <SelectItem key={bot.id} value={bot.id}>
                                    {bot.firstName} {bot.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="bidLimit">Лимит ставок (0 = без лимита)</Label>
                            <Input
                              id="bidLimit"
                              type="number"
                              min="0"
                              value={auctionBotData.bidLimit}
                              onChange={(e) => setAuctionBotData({...auctionBotData, bidLimit: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setIsAuctionBotDialogOpen(false)}>
                              Отмена
                            </Button>
                            <Button onClick={handleAddBotToAuction} disabled={addBotToAuctionMutation.isPending}>
                              {addBotToAuctionMutation.isPending ? "Добавление..." : "Добавить"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {auctionBots.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      В этом аукционе нет ботов
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Бот</TableHead>
                          <TableHead>Лимит ставок</TableHead>
                          <TableHead>Текущие ставки</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead>Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auctionBots.map((auctionBot) => (
                          <TableRow key={auctionBot.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                  <i className="fas fa-user text-white text-xs"></i>
                                </div>
                                <span>{auctionBot.bot.firstName} {auctionBot.bot.lastName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {auctionBot.bidLimit === 0 ? "Без лимита" : auctionBot.bidLimit}
                            </TableCell>
                            <TableCell>{auctionBot.currentBids}</TableCell>
                            <TableCell>
                              <Badge variant={auctionBot.isActive ? "default" : "secondary"}>
                                {auctionBot.isActive ? "Активен" : "Неактивен"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => removeBotFromAuctionMutation.mutate({
                                  auctionId: selectedAuctionForBots,
                                  botId: auctionBot.botId
                                })}
                                disabled={removeBotFromAuctionMutation.isPending}
                              >
                                <i className="fas fa-times mr-1"></i>
                                Удалить
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-line mr-2"></i>
              Статистика системы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Всего аукционов</span>
                <span className="font-semibold text-gray-900">{allAuctions.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Активных аукционов</span>
                <span className="font-semibold text-red-600">
                  {allAuctions.filter(a => a.status === 'live').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Предстоящих аукционов</span>
                <span className="font-semibold text-blue-600">
                  {allAuctions.filter(a => a.status === 'upcoming').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("completedAuctions")}</span>
                <span className="font-semibold text-green-600">
                  {allAuctions.filter(a => a.status === 'finished').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Всего ботов</span>
                <span className="font-semibold text-purple-600">
                  {allBots.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Активных ботов</span>
                <span className="font-semibold text-orange-600">
                  {allBots.filter(b => b.isActive).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}