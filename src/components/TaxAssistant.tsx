import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Search, FileText, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TaxSource {
  article: string;
  type: string;
  content: string;
  score: number;
}

interface TaxSearchResult {
  query: string;
  answer: string;
  sources: TaxSource[];
  processing_time_ms?: number;
}

interface ErrorResponse {
  error: string;
  hint?: string;
}

export default function TaxAssistant() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaxSearchResult | null>(null);
  const [error, setError] = useState<ErrorResponse | null>(null);
  const [isFirstRequest, setIsFirstRequest] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleSearch = async () => {
    if (query.trim().length < 3) {
      setError({ error: 'Please enter at least 3 characters' });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/tax/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), limit: 5 })
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.error || data.detail?.error || data.detail || 'Search failed';
        const hint = data.hint || data.detail?.hint;
        throw new Error(JSON.stringify({ error: errorMsg, hint }));
      }

      setResult(data);
      setIsFirstRequest(false);
      
    } catch (err) {
      try {
        const errorData = JSON.parse(err instanceof Error ? err.message : '{}');
        setError({
          error: errorData.error || 'Unknown error',
          hint: errorData.hint || (
            err instanceof Error && err.message.includes('fetch')
              ? 'Backend not running on port 8000'
              : isFirstRequest 
                ? 'First request may take 10-30s due to cold start. Retry.'
                : 'Please try again'
          )
        });
      } catch {
        setError({
          error: err instanceof Error ? err.message : 'Unknown error',
          hint: 'Check console for details'
        });
      }
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl">
      <Card className="shadow-lg">
        <CardHeader className="space-y-3">
          <CardTitle className="flex items-center gap-3 text-2xl md:text-3xl">
            <FileText className="w-8 h-8 text-primary" />
            Tajikistan Tax Code Assistant
          </CardTitle>
          <CardDescription className="text-base">
            AI-powered answers from Tajikistan tax law • RAG + Fine-tuned LLM
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about tax code (e.g., 'What is the VAT rate?')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSearch()}
              disabled={loading}
              className="text-base h-12"
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || query.trim().length < 3}
              size="lg"
              className="px-6"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </Button>
          </div>

          {isFirstRequest && loading && (
            <Alert className="bg-blue-50 border-blue-200">
              <Clock className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-900">First Request</AlertTitle>
              <AlertDescription className="text-blue-800">
                Services warming up (cold start). May take 10-30 seconds. 
                Next requests will be faster.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="space-y-1">
                <div>{error.error}</div>
                {error.hint && <div className="text-sm opacity-90 mt-2">💡 {error.hint}</div>}
              </AlertDescription>
            </Alert>
          )}

          {loading && !error && (
            <Alert>
              <Loader2 className="h-5 w-5 animate-spin" />
              <AlertTitle>Processing...</AlertTitle>
              <AlertDescription>
                Searching tax code and generating answer
                {isFirstRequest && ' (first request takes longer)'}
              </AlertDescription>
            </Alert>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {result.processing_time_ms && (
                <div className="flex justify-end">
                  <Badge variant="secondary" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {(result.processing_time_ms / 1000).toFixed(2)}s
                  </Badge>
                </div>
              )}

              <Card className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 border-2">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="text-3xl">🤖</span>
                    AI Answer
                    <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap leading-relaxed text-base">
                    {result.answer}
                  </p>
                </CardContent>
              </Card>

              {result.sources && result.sources.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    <h3 className="font-semibold text-lg">Referenced Articles</h3>
                    <Badge variant="outline">{result.sources.length}</Badge>
                  </div>
                  
                  <div className="grid gap-3">
                    {result.sources.map((source, idx) => (
                      <Card key={idx} className="bg-muted/30 hover:bg-muted/50 transition-colors">
                        <CardContent className="pt-4 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">📄</span>
                              <span className="font-semibold">Article {source.article}</span>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">{source.type}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {(source.score * 100).toFixed(0)}% match
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed pl-8">
                            {source.content}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Card className="bg-blue-50 dark:bg-blue-950/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">
                    💡 Try these:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "What is the VAT rate?",
                      "Corporate income tax rules",
                      "Tax exemptions"
                    ].map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery(q)}
                        className="text-xs"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
