
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ZoomIn, ZoomOut, Download, Database, ArrowUpDown } from "lucide-react";

interface RelationshipTable {
  id: string;
  name: string;
  display_name: string;
  fields: {
    id: string;
    name: string;
    display_name: string;
    field_type: string;
    related_table_id?: string;
    relationship_type?: string;
  }[];
}

interface RelationshipViewerProps {
  tables: RelationshipTable[];
}

export const RelationshipViewer = ({ tables }: RelationshipViewerProps) => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [activeView, setActiveView] = useState<"diagram" | "list">("diagram");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // When tables change, set the first table as selected by default
  useEffect(() => {
    if (tables.length > 0 && !selectedTable) {
      setSelectedTable(tables[0].id);
    }
  }, [tables, selectedTable]);

  // Function to calculate relationships between tables
  const getRelationships = () => {
    const relationships: {
      from: string;
      to: string;
      fromField: string;
      relationshipType: string;
    }[] = [];

    tables.forEach(table => {
      table.fields.forEach(field => {
        if (field.field_type === 'relation' && field.related_table_id) {
          relationships.push({
            from: table.id,
            to: field.related_table_id,
            fromField: field.name,
            relationshipType: field.relationship_type || 'one-to-many'
          });
        }
      });
    });

    return relationships;
  };

  // Find all relationships for the diagram
  const relationships = getRelationships();

  // Export the diagram as an SVG
  const exportDiagram = () => {
    try {
      const svg = document.querySelector('#relationship-diagram') as SVGElement;
      if (!svg) {
        toast.error("Diagram not found");
        return;
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svg.cloneNode(true) as SVGElement;
      
      // Add necessary attributes for standalone SVG
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      
      // Create a download link
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'custom-tables-relationships.svg');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Diagram exported successfully");
    } catch (error) {
      console.error("Error exporting diagram:", error);
      toast.error("Failed to export diagram");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Table Relationships</CardTitle>
          <div className="flex gap-2">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "diagram" | "list")}>
              <TabsList>
                <TabsTrigger value="diagram">Diagram</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>
            {activeView === "diagram" && (
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={exportDiagram}
                  title="Export diagram"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tables.length === 0 ? (
          <div className="text-center py-10">
            <Database className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No Custom Tables Defined</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create custom tables to see their relationships here.
            </p>
          </div>
        ) : (
          <div>
            {activeView === "diagram" ? (
              <div className="overflow-auto border rounded-md p-4 min-h-[400px]">
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left', transition: 'transform 0.3s ease' }}>
                  <svg id="relationship-diagram" width="800" height="600" viewBox="0 0 800 600">
                    <defs>
                      <marker
                        id="arrowhead-one"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
                      </marker>
                      <marker
                        id="arrowhead-many"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <line x1="0" y1="0" x2="0" y2="7" stroke="#888" strokeWidth="1.5" />
                        <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
                      </marker>
                    </defs>
                    
                    {/* Render tables */}
                    {tables.map((table, index) => {
                      // Position tables in a circular pattern
                      const total = tables.length;
                      const angle = (index / total) * 2 * Math.PI;
                      const radius = 200;
                      const x = 400 + radius * Math.cos(angle);
                      const y = 300 + radius * Math.sin(angle);
                      
                      return (
                        <g key={table.id} transform={`translate(${x}, ${y})`}>
                          <rect
                            x="-75"
                            y="-40"
                            width="150"
                            height="80"
                            rx="5"
                            ry="5"
                            fill="#f8fafc"
                            stroke="#e2e8f0"
                            strokeWidth="2"
                          />
                          <text
                            x="0"
                            y="0"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontWeight="bold"
                            fontSize="14"
                          >
                            {table.display_name}
                          </text>
                          <text
                            x="0"
                            y="20"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="12"
                            fill="#64748b"
                          >
                            {table.name}
                          </text>
                        </g>
                      );
                    })}
                    
                    {/* Render relationships as lines */}
                    {relationships.map((rel, index) => {
                      const fromTableIndex = tables.findIndex(t => t.id === rel.from);
                      const toTableIndex = tables.findIndex(t => t.id === rel.to);
                      
                      if (fromTableIndex === -1 || toTableIndex === -1) return null;
                      
                      const total = tables.length;
                      const fromAngle = (fromTableIndex / total) * 2 * Math.PI;
                      const toAngle = (toTableIndex / total) * 2 * Math.PI;
                      const radius = 200;
                      
                      const fromX = 400 + radius * Math.cos(fromAngle);
                      const fromY = 300 + radius * Math.sin(fromAngle);
                      const toX = 400 + radius * Math.cos(toAngle);
                      const toY = 300 + radius * Math.sin(toAngle);
                      
                      // Calculate vector from start to end
                      const dx = toX - fromX;
                      const dy = toY - fromY;
                      const length = Math.sqrt(dx * dx + dy * dy);
                      
                      // Normalize the vector
                      const ndx = dx / length;
                      const ndy = dy / length;
                      
                      // Adjust start and end points to begin/end at rectangle edges
                      const fromOuterX = fromX + ndx * 75;
                      const fromOuterY = fromY + ndy * 40;
                      const toOuterX = toX - ndx * 75;
                      const toOuterY = toY - ndy * 40;
                      
                      // Add a curve to the line
                      const midX = (fromOuterX + toOuterX) / 2;
                      const midY = (fromOuterY + toOuterY) / 2;
                      
                      // Offset the midpoint perpendicular to the line
                      const perpX = ndy;
                      const perpY = -ndx;
                      const offset = 30;
                      const ctrlX = midX + perpX * offset;
                      const ctrlY = midY + perpY * offset;
                      
                      // Determine marker based on relationship type
                      const markerEnd = rel.relationshipType === 'one-to-one' 
                        ? 'url(#arrowhead-one)' 
                        : 'url(#arrowhead-many)';
                      
                      return (
                        <g key={`rel-${index}`}>
                          <path
                            d={`M ${fromOuterX} ${fromOuterY} Q ${ctrlX} ${ctrlY} ${toOuterX} ${toOuterY}`}
                            fill="none"
                            stroke="#888"
                            strokeWidth="1.5"
                            strokeDasharray={rel.relationshipType === 'many-to-many' ? "5,5" : "none"}
                            markerEnd={markerEnd}
                          />
                          <text
                            x={ctrlX}
                            y={ctrlY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="12"
                            fill="#64748b"
                            transform={`translate(0, -10)`}
                          >
                            {rel.relationshipType}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Select value={selectedTable || ''} onValueChange={setSelectedTable}>
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map(table => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTable && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Relationships</h3>
                    
                    {/* Show relationships for the selected table */}
                    {relationships
                      .filter(rel => rel.from === selectedTable || rel.to === selectedTable)
                      .map((rel, idx) => {
                        const isSource = rel.from === selectedTable;
                        const otherTableId = isSource ? rel.to : rel.from;
                        const otherTable = tables.find(t => t.id === otherTableId);
                        
                        if (!otherTable) return null;
                        
                        return (
                          <Card key={`rel-${idx}`} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {isSource ? 'References' : 'Referenced by'}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {otherTable.display_name}
                                  </div>
                                </div>
                                <ArrowUpDown className="h-4 w-4 mx-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="font-medium">Relationship</div>
                                  <div className="text-sm text-muted-foreground">
                                    {rel.relationshipType}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    
                    {relationships.filter(rel => rel.from === selectedTable || rel.to === selectedTable).length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">
                          No relationships found for this table.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RelationshipViewer;
