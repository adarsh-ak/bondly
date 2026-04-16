import React, { useState, useEffect } from 'react';
import { Phone, Video, Mic, MicOff, Camera, RotateCw, X } from 'lucide-react';
import { Button } from "../components/ui/button";

const CallModal = ({ type = "audio", onClose }) => {
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(type === "video");

  useEffect(() => {
    const timer = setInterval(() => setDuration(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (sec) =>
    `${Math.floor(sec / 60).toString().padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-full max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden flex flex-col">
        {/* Timer */}
        <div className="absolute top-4 left-4 z-50 bg-black/50 text-white rounded-lg px-3 py-1 text-sm">
          {type === "video" ? "Video Call" : "Audio Call"} - {formatTime(duration)}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Video/Avatar Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          {type === "video" ? (
            <div className="grid grid-cols-2 gap-4 h-full w-full">
              <div className="bg-gray-800 rounded-lg flex items-center justify-center relative">
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-6xl">📹</div>
                </div>
                <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
                  You
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg flex items-center justify-center relative">
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-6xl">👤</div>
                </div>
                <div className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded">
                  Contact
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center text-white text-6xl font-bold mb-4 shadow-primary">
                A
              </div>
              <h3 className="text-white text-2xl font-semibold mb-2">Audio Call</h3>
              <p className="text-gray-300">Connected to Contact</p>
              <div className="mt-4 flex items-center justify-center space-x-4">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">Connected</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4 p-6 bg-black/20">
          <Button
            onClick={() => setMuted(!muted)}
            variant="secondary"
            size="icon"
            className={`p-4 rounded-full shadow-lg transition-colors ${
              muted ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {muted ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
          </Button>

          {type === "video" && (
            <Button
              onClick={() => setVideoOn(!videoOn)}
              variant="secondary"
              size="icon"
              className="p-4 rounded-full shadow-lg bg-gray-700 hover:bg-gray-600 text-white"
            >
              <Camera size={24} />
            </Button>
          )}

          <Button
            variant="secondary"
            size="icon"
            className="p-4 rounded-full shadow-lg bg-gray-700 hover:bg-gray-600 text-white"
          >
            <RotateCw size={24} />
          </Button>

          <Button
            onClick={onClose}
            variant="destructive"
            size="icon"
            className="p-4 rounded-full shadow-lg bg-red-600 hover:bg-red-700 text-white"
          >
            <Phone size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;