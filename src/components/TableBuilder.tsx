
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileUp, Wand, Database, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTableBuilderService, TableSchema, FileContent } from "@/hooks/useTableBuilderService";

export function TableBuilder() {
  const [activeTab, setActiveTab] = useState<string>("text");
  const [prompt, setPrompt] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [isCreatingTables, setIsCreatingTables] = useState<boolean>(false);
  const [creationResult, setCreationResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const tableBuilderService = useTableBuilderService();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const handlePromptSubmit = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt describing the tables you need");
      return;
    }
    
    setIsProcessing(true);
    try {
      const generatedSchema = await tableBuilderService.generateSchema(prompt);
      setSchema(generatedSchema);
      toast.success("Table schema generated successfully");
    } catch (error) {
      console.error("Error generating schema:", error);
      toast.error("Failed to generate schema");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleFileAnalysis = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }
    
    setIsProcessing(true);
    try {
      const fileContents = await tableBuilderService.processFiles(files);
      const generatedSchema = await tableBuilderService.analyzeFiles(fileContents);
      setSchema(generatedSchema);
      toast.success("Files analyzed and schema generated");
    } catch (error) {
      console.error("Error analyzing files:", error);
      toast.error("Failed to analyze files");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCreateTables = async (importData: boolean = false) => {
    if (!schema) {
      toast.error("Please generate a schema first");
      return;
    }
    
    setIsCreatingTables(true);
    try {
      if (importData && files.length > 0) {
        const fileContents = await tableBuilderService.processFiles(files);
        const result = await tableBuilderService.importData(schema, fileContents);
        setCreationResult(result);
        toast.success(`Created ${Object.keys(result.table_ids).length} tables and imported data`);
      } else {
        const tableIds = await tableBuilderService.createTables(schema);
        setCreationResult({ table_ids: tableIds });
        toast.success(`Created ${Object.keys(tableIds).length} tables`);
      }
    } catch (error) {
      console.error("Error creating tables:", error);
      toast.error("Failed to create tables");
    } finally {
      setIsCreatingTables(false);
    }
  };
  
  const resetForm = () => {
    setPrompt("");
    setFiles([]);
    setSchema(null);
    setCreationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">AI Table Builder</h2>
        <p className="text-muted-foreground">
          Let AI help you design and create database tables for your application
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">Text Prompt</TabsTrigger>
          <TabsTrigger value="files">File Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Tables</CardTitle>
              <CardDescription>
                Explain what kind of application you're building, and the AI will suggest tables and fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="For example: I need a CRM system to track customers, deals, and communications..."
                className="min-h-[200px]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isProcessing}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetForm} disabled={isProcessing}>
                Reset
              </Button>
              <Button onClick={handlePromptSubmit} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand className="mr-2 h-4 w-4" />
                    Generate Schema
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Data Files</CardTitle>
              <CardDescription>
                Upload CSV, JSON, or Excel files and the AI will create tables based on your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileUp className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      CSV, JSON, Excel files
                    </p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isProcessing}
                    accept=".csv,.json,.xlsx,.xls,.txt"
                  />
                </label>
              </div>
              
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Files:</p>
                  <ul className="text-sm">
                    {Array.from(files).map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetForm} disabled={isProcessing}>
                Reset
              </Button>
              <Button onClick={handleFileAnalysis} disabled={isProcessing || files.length === 0}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand className="mr-2 h-4 w-4" />
                    Analyze Files
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {schema && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Generated Schema</CardTitle>
            <CardDescription>
              Review the tables and fields the AI has suggested
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Explanation</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {schema.explanation}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Tables</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {schema.tables.map((table) => (
                    <Card key={table.name} className="border">
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">{table.display_name}</CardTitle>
                        <CardDescription className="text-xs">
                          {table.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="py-2">
                        <ScrollArea className="h-48">
                          <div className="space-y-2">
                            {table.fields.map((field) => (
                              <div key={field.name} className="text-sm">
                                <div className="flex items-center">
                                  <span className="font-medium">{field.display_name}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">({field.field_type})</span>
                                  {field.is_required && (
                                    <span className="ml-2 text-xs text-red-500">*</span>
                                  )}
                                  {field.is_unique && (
                                    <span className="ml-2 text-xs text-blue-500">unique</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {field.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {schema.relationships && schema.relationships.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium">Relationships</h3>
                  <div className="mt-2 space-y-2">
                    {schema.relationships.map((rel, index) => (
                      <div key={index} className="p-3 border rounded-md">
                        <p className="text-sm">
                          <span className="font-medium">{rel.from_table}.{rel.from_field}</span>
                          {" → "}
                          <span className="font-medium">{rel.to_table}.{rel.to_field}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({rel.relationship_type})
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetForm} disabled={isCreatingTables}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start Over
            </Button>
            <div className="space-x-2">
              <Button 
                onClick={() => handleCreateTables(true)} 
                disabled={isCreatingTables || !(activeTab === "files" && files.length > 0)}
              >
                {isCreatingTables ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileUp className="mr-2 h-4 w-4" />
                    Create & Import Data
                  </>
                )}
              </Button>
              <Button 
                onClick={() => handleCreateTables(false)} 
                disabled={isCreatingTables}
              >
                {isCreatingTables ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Create Tables
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
      
      {creationResult && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="flex items-center text-green-600 dark:text-green-400">
              <Check className="mr-2 h-5 w-5" />
              Success!
            </CardTitle>
            <CardDescription>
              Your tables have been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {creationResult.message || `Created ${Object.keys(creationResult.table_ids || {}).length} tables`}
            </p>
            {creationResult.import_results && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Import Results:</h3>
                <ul className="text-sm space-y-1">
                  {Object.entries(creationResult.import_results).map(([table, count]) => (
                    <li key={table}>
                      {table}: {count} records imported
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={resetForm}>
              Build More Tables
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
