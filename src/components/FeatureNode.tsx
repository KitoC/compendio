
import React, { useEffect, useRef } from 'react';
import { CalendarIcon, MailIcon, MessageCircleIcon, FileTextIcon, BuildingIcon } from 'lucide-react';

type FeatureNodeProps = {
  type: 'crm' | 'messaging' | 'quotes' | 'invoices' | 'calendar' | 'email';
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
    case 'crm':
      return <BuildingIcon className="h-5 w-5 mr-2 text-blue-500" />;
    case 'messaging':
      return <MessageCircleIcon className="h-5 w-5 mr-2 text-green-500" />;
    case 'quotes':
    case 'invoices':
      return <FileTextIcon className="h-5 w-5 mr-2 text-amber-500" />;
    case 'calendar':
      return <CalendarIcon className="h-5 w-5 mr-2 text-purple-500" />;
    case 'email':
      return <MailIcon className="h-5 w-5 mr-2 text-red-500" />;
    default:
      return <MessageCircleIcon className="h-5 w-5 mr-2 text-blue-500" />;
  }
};

const getLabel = (type: string) => {
  switch (type) {
    case 'crm':
      return 'CRM';
    case 'messaging':
      return 'Messaging';
    case 'quotes':
      return 'Quotes';
    case 'invoices':
      return 'Invoices';
    case 'calendar':
      return 'Calendar';
    case 'email':
      return 'Email';
    default:
      return 'Feature';
  }
};

export const FeatureNode: React.FC<FeatureNodeProps> = ({ type, delay, position, phoneRef }) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!nodeRef.current || !phoneRef.current || !svgRef.current) return;
    
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
      path.style.animationDelay = `${delay * 0.1}s`;
      
      // Clear and append
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild);
      }
      svg.appendChild(path);
    };
    
    drawConnectionLine();
    window.addEventListener('resize', drawConnectionLine);
    
    return () => {
      window.removeEventListener('resize', drawConnectionLine);
    };
  }, [phoneRef, delay]);
  
  return (
    <div 
      className={`feature-node animate-rotate-node`}
      ref={nodeRef}
      style={{
        ...position,
        animationDelay: `${delay * 0.1}s`,
        animationFillMode: 'both'
      }}
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
