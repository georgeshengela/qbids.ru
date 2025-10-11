import { useState } from "react";
import { WelcomeModal } from "@/components/welcome-modal";
import { Button } from "@/components/ui/button";

export default function WelcomePreview() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Welcome Modal Preview</h1>
        <p className="text-slate-600">Click the button below to see the welcome modal</p>
        
        <Button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Show Welcome Modal
        </Button>

        <WelcomeModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          username="Пользователь"
        />
      </div>
    </div>
  );
}