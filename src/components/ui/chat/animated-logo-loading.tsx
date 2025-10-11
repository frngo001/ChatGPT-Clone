import React from 'react';

export default function AnimatedLogoLoading() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* Small elegant loading animation */}
        <div className="relative w-6 h-6">
          {/* Central dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDuration: '1.2s' }}></div>
          
          {/* Single orbiting dot */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 bg-primary/60 rounded-full"></div>
          </div>
          
          {/* Gentle breathing ring */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-primary/30 rounded-full animate-pulse" style={{ animationDuration: '2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
