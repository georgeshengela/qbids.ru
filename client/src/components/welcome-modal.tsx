import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/use-language";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export function WelcomeModal({ isOpen, onClose, username }: WelcomeModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="welcome-description">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 relative">
            <i className="fas fa-gift text-white text-2xl"></i>
            {showConfetti && (
              <div className="absolute inset-0 animate-ping">
                <div className="w-full h-full bg-yellow-400 rounded-full opacity-30"></div>
              </div>
            )}
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {t("welcomeTitle").replace("{username}", username)}
          </DialogTitle>
          <DialogDescription id="welcome-description" className="text-base text-gray-600 mt-2">
            {t("welcomeDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Gift Card */}
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-coins text-white text-xl"></i>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-gray-900">{t("freeBids")}</h3>
                  <p className="text-sm text-gray-600">{t("giftForNewUsers")}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {t("welcomeGiftMessage")}
              </p>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center">
              <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
              {t("quickTips")}
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                <span>{t("placePrebids")}</span>
              </div>
              <div className="flex items-start space-x-2">
                <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                <span>{t("participateInLive")}</span>
              </div>
              <div className="flex items-start space-x-2">
                <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
                <span>{t("watchBalance")}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <i className="fas fa-play mr-2"></i>
              {t("startParticipating")}
            </Button>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <i className="fas fa-question-circle mr-2"></i>
              {t("howItWorks")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}