import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useQualityDocuments } from '../../hooks/useQualityDocuments';
import { Loader2, Eye, Download, Trash2 } from 'lucide-react';

export const Documents = (): JSX.Element => {
  const [selectedType, setSelectedType] = useState<'procedure' | 'template' | 'proof' | undefined>(undefined);
  const { documents, loading, error } = useQualityDocuments(selectedType);

  const getDocumentIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return '🖼️';
      default:
        return '📁';
    }
  };

  const getDocumentBgColor = (type: string) => {
    switch (type) {
      case 'procedure':
        return 'bg-orange-100';
      case 'template':
        return 'bg-blue-100';
      case 'proof':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleView = (docId: number) => {
    console.log('View document:', docId);
    // TODO: Implement document view
  };

  const handleDownload = (docId: number) => {
    console.log('Download document:', docId);
    // TODO: Implement document download
  };

  const handleDelete = (docId: number) => {
    console.log('Delete document:', docId);
    // TODO: Implement document deletion with confirmation
  };

  if (loading) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardContent className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff7700]" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-[27px] py-8">
        <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
          <CardContent className="text-center py-8">
            <p className="text-red-500">Erreur: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-[27px] py-8">
      <Card className="border-2 border-[#e2e2ea] rounded-[18px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="[font-family:'Poppins',Helvetica] font-semibold text-[#19294a] text-2xl">
              Mes Documents
            </CardTitle>
            <Button 
              className="bg-[#ff7700] hover:bg-[#e66900] text-white"
              onClick={() => console.log('Add document')}
            >
              Ajouter Un Document
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant="outline" 
              className={selectedType === undefined ? "bg-[#ffe5ca] border-[#ff7700] text-[#ff7700] font-semibold" : "border-[#dadfe8] text-[#6a90b9]"}
              onClick={() => setSelectedType(undefined)}
            >
              Tous
            </Button>
            <Button 
              variant="outline" 
              className={selectedType === 'procedure' ? "bg-[#ffe5ca] border-[#ff7700] text-[#ff7700] font-semibold" : "border-[#dadfe8] text-[#6a90b9]"}
              onClick={() => setSelectedType('procedure')}
            >
              Procédures
            </Button>
            <Button 
              variant="outline" 
              className={selectedType === 'template' ? "bg-[#ffe5ca] border-[#ff7700] text-[#ff7700] font-semibold" : "border-[#dadfe8] text-[#6a90b9]"}
              onClick={() => setSelectedType('template')}
            >
              Modèles
            </Button>
            <Button 
              variant="outline" 
              className={selectedType === 'proof' ? "bg-[#ffe5ca] border-[#ff7700] text-[#ff7700] font-semibold" : "border-[#dadfe8] text-[#6a90b9]"}
              onClick={() => setSelectedType('proof')}
            >
              Preuves
            </Button>
          </div>

          {/* Documents List */}
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="[font-family:'Poppins',Helvetica] text-[#6a90b9] mb-2">Aucun document trouvé</p>
              <p className="[font-family:'Poppins',Helvetica] text-sm text-[#6a90b9]/70">
                Ajoutez votre premier document pour commencer
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-4 p-4 rounded-[10px] border border-[#ebf1ff] hover:border-[#ff7700] hover:shadow-md transition-all cursor-pointer"
              >
                <div className={`flex items-center justify-center p-[17px] ${getDocumentBgColor(doc.type)} rounded-xl`}>
                  <span className="text-3xl">
                    {getDocumentIcon(doc.filename)}
                  </span>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  <h4 className="[font-family:'Inter',Helvetica] font-semibold text-black text-base">
                    {doc.filename}
                  </h4>
                  {doc.indicator_numbers && doc.indicator_numbers.length > 0 ? (
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center gap-[6.97px]">
                        {doc.indicator_numbers.slice(0, 3).map((num) => (
                          <div
                            key={num}
                            className="flex items-center justify-center w-5 h-5 bg-[#6a90b9] rounded-full"
                          >
                            <span className="[font-family:'Poppins',Helvetica] font-semibold text-white text-xs text-center">
                              {num}
                            </span>
                          </div>
                        ))}
                      </div>
                      <span className="[font-family:'Inter',Helvetica] font-semibold text-[#00000066] text-sm">
                        +{doc.indicator_numbers.length} Indicateurs
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5">
                      <span className="[font-family:'Inter',Helvetica] font-semibold text-[#00000066] text-sm">
                        {doc.type.toUpperCase()}
                      </span>
                      {doc.file_size && (
                        <span className="[font-family:'Inter',Helvetica] font-semibold text-[#00000066] text-sm">
                          {formatFileSize(doc.file_size)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(doc.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-blue-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc.id);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

