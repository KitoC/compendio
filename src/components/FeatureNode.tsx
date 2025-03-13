
import React, { useEffect, useRef, useState } from 'react';
import { WrenchIcon, HammerIcon, TruckIcon, HomeIcon, MessageCircleIcon, CalendarIcon } from 'lucide-react';

type FeatureNodeProps = {
  type: 'repairs' | 'construction' | 'messaging' | 'quotes' | 'scheduling' | 'transport';
  delay: number;
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  phoneRef: React.RefObject<HTMLDivElement>;
};

const getIcon = (type: string) => {
  switch (type) {
    case 'repairs':
      return <WrenchIcon className="h-5 w-5 mr-2 text-primary" />;
    case 'construction':
      return <HammerIcon className="h-5 w-5 mr-2 text-accent" />;
    case 'messaging':
      return <MessageCircleIcon className="h-5 w-5 mr-2 text-green-500" />;
    case 'quotes':
      return <HomeIcon className="h-5 w-5 mr-2 text-amber-500" />;
    case 'scheduling':
      return <CalendarIcon className="h-5 w-5 mr-2 text-purple-500" />;
    case 'transport':
      return <TruckIcon className="h-5 w-5 mr-2 text-red-500" />;
    default:
      return <WrenchIcon className="h-5 w-5 mr-2 text-primary" />;
  }
};

const getLabel = (type: string) => {
  switch (type) {
    case 'repairs':
      return 'Repairs';
    case 'construction':
      return 'Construction';
    case 'messaging':
      return 'Messaging';
    case 'quotes':
      return 'Quotes';
    case 'scheduling':
      return 'Scheduling';
    case 'transport':
      return 'Transport';
    default:
      return 'Service';
  }
};

export const FeatureNode: React.FC<FeatureNodeProps> = ({ type, delay, position, phoneRef }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Add visibility after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay * 100);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  useEffect(() => {
    if (!nodeRef.current || !phoneRef.current || !svgRef.current || !isVisible) return;
    
    const drawConnectionLine = () => {
      const phoneRect = phoneRef.current?.getBoundingClientRect();
      const nodeRect = nodeRef.current?.getBoundingClientRect();
      const svg = svgRef.current;
      
      if (!phoneRect || !nodeRect || !svg) return;
      
      // Calculate phone center
      const phoneCenterX = phoneRect.width / 2;
      const phoneCenterY = phoneRect.height / 2;
      
      // Calculate relative positions
      const nodeCenterX = (nodeRect.left - phoneRect.left) + (nodeRect.width / 2);
      const nodeCenterY = (nodeRect.top - phoneRect.top) + (nodeRect.height / 2);
      
      // Draw path
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${phoneCenterX},${phoneCenterY} Q${(phoneCenterX + nodeCenterX) / 2},${(phoneCenterY + nodeCenterY) / 1.5} ${nodeCenterX},${nodeCenterY}`);
      path.setAttribute('class', 'node-line');
      
      // Clear and append
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }
      svg.appendChild(path);
    };
    
    // Initial draw
    drawConnectionLine();
    
    // Handle window resize
    window.addEventListener('resize', drawConnectionLine);
    
    return () => {
      window.removeEventListener('resize', drawConnectionLine);
    };
  }, [phoneRef, isVisible]);
  
  const nodeStyle = {
    ...position,
    opacity: isVisible ? 1 : 0,
    animation: isVisible ? `rotate-node 3s ease-in-out infinite ${delay * 0.2}s` : 'none',
  };
  
  return (
    <div 
      className="feature-node"
      ref={nodeRef}
      style={nodeStyle}
    >
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: -1 }}
      />
      {getIcon(type)}
      <span className="font-medium">{getLabel(type)}</span>
    </div>
  );
};

export default FeatureNode;
