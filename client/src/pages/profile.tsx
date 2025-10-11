import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { Auction, Bid, UserStats } from "@/types/auction";

interface UserProfile {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bidBalance: number;
  createdAt: string;
}

interface WonAuction {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  finalPrice: number;
  wonAt: string;
}

export default function Profile() {
  const { user, isAuthenticated, refetch: refetchAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { formatCurrency } = useSettings();
  const { t, language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
  });

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users/profile"],
    enabled: isAuthenticated,
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : "",
        gender: profile.gender || "",
      });
    }
  }, [profile]);

  // Fetch user statistics
  const { data: stats } = useQuery<UserStats>({
    queryKey: ["/api/users/stats"],
    enabled: isAuthenticated,
  });

  // Fetch won auctions
  const { data: wonAuctions = [] } = useQuery<WonAuction[]>({
    queryKey: ["/api/users/won-auctions"],
    enabled: isAuthenticated,
  });

  // Fetch recent bids
  const { data: recentBids = [] } = useQuery<Bid[]>({
    queryKey: ["/api/users/recent-bids"],
    enabled: isAuthenticated,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest("PUT", "/api/users/profile", data),
    onSuccess: () => {
      toast({
        title: t("profileUpdated"),
        description: t("profileUpdatedDesc"),
      });
      setIsEditing(false);
      refetchAuth();
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
    },
    onError: (error: any) => {
      let errorMessage = t("updateProfileError");
      
      // Parse error response to show specific validation errors
      if (error.message && error.message.includes("400:")) {
        try {
          const errorData = JSON.parse(error.message.split("400: ")[1]);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If parsing fails, check for common error patterns
          if (error.message.includes("+996")) {
            errorMessage = "Введите номер в формате +996XXXXXXXXX";
          } else if (error.message.includes("email")) {
            errorMessage = "Введите корректный email адрес";
          }
        }
      }
      
      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const formatDate = (dateString: string) => {
    const localeMap = {
      'ru': 'ru-RU',
      'en': 'en-US', 
      'ka': 'ka-GE'
    };
    
    return new Date(dateString).toLocaleDateString(localeMap[language as keyof typeof localeMap] || 'ru-RU', {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-[1504px] mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t("error")}</h1>
          <p className="text-gray-600 mb-8">{t("loginRequired")}</p>
          <Link href="/">
            <Button>{t("home")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-[1504px] mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t("loading")}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Breadcrumb Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1504px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <i className="fas fa-arrow-left"></i>
                  <span>{t("back")}</span>
                </Button>
              </Link>
              <div className="text-sm text-gray-500">
                <span>{t("home")}</span>
                <i className="fas fa-chevron-right mx-2"></i>
                <span className="text-gray-900 font-medium">{t("profileTitle")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1504px] mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <i className="fas fa-user text-blue-500 mr-3"></i>
            {t("profileTitle")}
          </h1>
          <p className="text-gray-600">{t("profileDescription")}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Form */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-edit text-green-500"></i>
                  <span>{t("personalInfo")}</span>
                </CardTitle>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} variant="outline">
                    <i className="fas fa-edit mr-2"></i>
                    {t("editButton")}
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => setIsEditing(false)} 
                      variant="outline"
                      size="sm"
                    >
                      {t("cancel")}
                    </Button>
                    <Button 
                      onClick={handleSubmit}
                      disabled={updateProfileMutation.isPending}
                      size="sm"
                    >
                      {updateProfileMutation.isPending ? `${t("loading")}...` : t("save")}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">{t("username")}</Label>
                      <Input
                        id="username"
                        value={profile?.username || ""}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t("username")} cannot be changed</p>
                    </div>
                    <div>
                      <Label htmlFor="bidBalance">{t("bidBalance")}</Label>
                      <Input
                        id="bidBalance"
                        value={`${formatCurrency(profile?.bidBalance || 0)} бидов`}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{t("firstName")} *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        disabled={!isEditing}
                        required
                        placeholder={`Enter your ${t("firstName").toLowerCase()}`}
                      />
                      <p className="text-xs text-gray-500 mt-1">{t("minimumTwoChars")}</p>
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t("lastName")} *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        disabled={!isEditing}
                        required
                        placeholder={`Enter your ${t("lastName").toLowerCase()}`}
                      />
                      <p className="text-xs text-gray-500 mt-1">{t("minimumTwoChars")}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="example@mail.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t("validEmailRequired")}</p>
                  </div>

                  <div>
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="+996501234567"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t("phoneFormat")}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">{t("dateOfBirth")}</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        disabled={!isEditing}
                      />
                      <p className="text-xs text-gray-500 mt-1">{t("mustBe18OrOlder")}</p>
                    </div>
                    <div>
                      <Label htmlFor="gender">{t("gender")}</Label>
                      {isEditing ? (
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("selectGender")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">{t("male")}</SelectItem>
                            <SelectItem value="female">{t("female")}</SelectItem>
                            <SelectItem value="other">{t("other")}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={formData.gender ? (formData.gender === "male" ? t("male") : formData.gender === "female" ? t("female") : t("other")) : ""}
                          disabled
                          className="bg-gray-50"
                        />
                      )}
                      <p className="text-xs text-gray-500 mt-1">{t("genderRequired")}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      <i className="fas fa-calendar mr-2"></i>
                      {t("registrationDate")}: {profile ? formatDate(profile.createdAt) : "Unknown"}
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Won Auctions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-trophy text-yellow-500"></i>
                  <span>{t("wonAuctions")}</span>
                  <Badge variant="secondary">{wonAuctions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {wonAuctions.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-trophy text-gray-300 text-4xl mb-4"></i>
                    <p className="text-gray-500 mb-2">{t("noWonAuctions")}</p>
                    <p className="text-sm text-gray-400">{t("participateToWinPrizes")}</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {wonAuctions.map((auction) => (
                      <div key={auction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <img
                            src={auction.imageUrl}
                            alt={auction.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{auction.title}</h4>
                            <p className="text-sm text-gray-500">
                              {t("won")} {formatDate(auction.wonAt)}
                            </p>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              {formatCurrency(auction.finalPrice)}
                            </p>
                            <Link href={`/auction/${auction.slug}`}>
                              <Button variant="outline" size="sm" className="mt-2">
                                <i className="fas fa-external-link-alt mr-1"></i>
                                {t("view")}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Statistics */}
          <div className="space-y-6">
            {/* User Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-chart-bar text-blue-500"></i>
                  <span>{t("statistics")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-gavel text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t("activeBids")}</p>
                      <p className="text-xl font-bold text-blue-600">{stats?.activeBids || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-clock text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t("activePrebids")}</p>
                      <p className="text-xl font-bold text-orange-600">{stats?.activePrebids || 0}</p>
                    </div>  
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-trophy text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t("wonAuctionsCount")}</p>
                      <p className="text-xl font-bold text-green-600">{stats?.wonAuctions || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-coins text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t("totalSpent")}</p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatCurrency(stats?.totalSpent || 0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ({t("bidsAndPrebids")})
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-percentage text-white"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t("successRate")}</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {stats?.activeBids && stats.activeBids > 0 
                          ? Math.round(((stats.wonAuctions || 0) / stats.activeBids) * 100) 
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-history text-orange-500"></i>
                  <span>{t("lastBids")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentBids.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-history text-gray-300 text-2xl mb-2"></i>
                    <p className="text-sm text-gray-500">{t("noRecentBids")}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {recentBids.slice(0, 10).map((bid) => (
                      <div key={bid.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <i className="fas fa-gavel text-white text-xs"></i>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-900 truncate max-w-[100px]">
                              Аукцион #{bid.auctionId.slice(-4)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(bid.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-blue-600">{formatCurrency(bid.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link href="/bid-history">
                    <Button variant="outline" className="w-full">
                      <i className="fas fa-external-link-alt mr-2"></i>
                      {t("viewFullHistory")}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}