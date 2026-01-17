import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Image, 
  Code, 
  Search, 
  GraduationCap, 
  FileQuestion,
  Send,
  Trash2,
  Download,
  Copy,
  Play,
  Sparkles,
  Bot,
  User,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAIChat, AIType } from '@/hooks/useAIChat';
import { PageTransition } from '@/components/ui/PageTransition';
import { DotLoader } from '@/components/ui/DotLoader';
import { useNavigate } from 'react-router-dom';

const AI_TOOLS = [
  { id: 'chat', name: 'Chat AI', icon: MessageSquare, description: 'General conversation & help', color: 'from-blue-500 to-cyan-500' },
  { id: 'image', name: 'Image Gen', icon: Image, description: 'Generate images from text', color: 'from-purple-500 to-pink-500' },
  { id: 'code', name: 'Code Gen', icon: Code, description: 'Generate apps & games', color: 'from-green-500 to-emerald-500' },
  { id: 'research', name: 'Research', icon: Search, description: 'Deep research & analysis', color: 'from-orange-500 to-red-500' },
  { id: 'academic', name: 'Academic', icon: GraduationCap, description: 'Academic writing & essays', color: 'from-indigo-500 to-purple-500' },
  { id: 'test', name: 'Test Maker', icon: FileQuestion, description: 'Create quizzes & tests', color: 'from-teal-500 to-cyan-500' },
];

export default function TechAI() {
  const navigate = useNavigate();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const { messages, isLoading, sendMessage, clearMessages } = useAIChat({
    type: (selectedTool as AIType) || 'chat',
    onError: (error) => toast.error(error),
  });

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || imageLoading) return;
    setImageLoading(true);
    setGeneratedImage(null);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      if (!resp.ok) {
        const error = await resp.json();
        throw new Error(error.error || 'Failed to generate image');
      }

      const data = await resp.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        toast.success('Image generated successfully!');
      } else {
        throw new Error('No image received');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setImageLoading(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const downloadCode = (code: string, filename: string = 'code.txt') => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  const renderToolGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {AI_TOOLS.map((tool) => (
        <motion.div
          key={tool.id}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="cursor-pointer border-2 border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden group"
            onClick={() => setSelectedTool(tool.id)}
          >
            <CardContent className="p-4 md:p-6">
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <tool.icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <h3 className="font-bold text-sm md:text-lg mb-1">{tool.name}</h3>
              <p className="text-xs md:text-sm text-muted-foreground">{tool.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  const renderImageGenerator = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          className="min-h-[100px]"
        />
      </div>
      <Button 
        onClick={handleGenerateImage} 
        disabled={imageLoading || !imagePrompt.trim()}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {imageLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Image
          </>
        )}
      </Button>

      {imageLoading && (
        <div className="flex justify-center py-8">
          <DotLoader />
        </div>
      )}

      {generatedImage && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <img 
            src={generatedImage} 
            alt="Generated" 
            className="w-full rounded-xl border-2 border-border"
          />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                navigator.clipboard.writeText(generatedImage);
                toast.success('Image URL copied!');
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                const a = document.createElement('a');
                a.href = generatedImage;
                a.download = 'generated-image.png';
                a.target = '_blank';
                a.click();
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderChatInterface = () => (
    <div className="flex flex-col h-[calc(100vh-280px)] md:h-[600px]">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Start a conversation</p>
              <p className="text-sm">Ask me anything!</p>
            </div>
          )}
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}>
                  {selectedTool === 'code' && msg.role === 'assistant' ? (
                    <div className="space-y-2">
                      <pre className="whitespace-pre-wrap text-sm overflow-x-auto">{msg.content}</pre>
                      <div className="flex gap-2 pt-2 border-t border-border/50">
                        <Button size="sm" variant="ghost" onClick={() => copyCode(msg.content)}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => downloadCode(msg.content)}>
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <DotLoader />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border pt-4 mt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={clearMessages}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={selectedTool === 'code' ? "Describe the app or game you want to create..." : "Type your message..."}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()}
            className="bg-gradient-to-r from-primary to-primary/80"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const currentTool = AI_TOOLS.find(t => t.id === selectedTool);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            {selectedTool ? (
              <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => setSelectedTool(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${currentTool?.color} flex items-center justify-center`}>
                  {currentTool && <currentTool.icon className="h-6 w-6 text-white" />}
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold">{currentTool?.name}</h1>
                  <p className="text-sm text-muted-foreground">{currentTool?.description}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  Tech AI
                </h1>
                <p className="text-muted-foreground mt-2">Powered by advanced AI models</p>
              </>
            )}
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {!selectedTool ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {renderToolGrid()}
              </motion.div>
            ) : (
              <motion.div
                key={selectedTool}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card className="border-2 border-border/50">
                  <CardContent className="p-4 md:p-6">
                    {selectedTool === 'image' ? renderImageGenerator() : renderChatInterface()}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
