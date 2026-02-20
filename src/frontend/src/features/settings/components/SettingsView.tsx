import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetOpenAIConfig, useSaveOpenAIConfig, useValidateOpenAIConfig } from '../../../hooks/useQueries';
import { toast } from 'sonner';
import { Sparkles, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function SettingsView() {
  const { data: openAIConfig, isLoading: configLoading } = useGetOpenAIConfig();
  const { data: isConfigValid, isLoading: validationLoading } = useValidateOpenAIConfig();
  const saveOpenAIConfig = useSaveOpenAIConfig();

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      await saveOpenAIConfig.mutateAsync(apiKey.trim());
      toast.success('OpenAI API key saved successfully');
      setApiKey('');
    } catch (error) {
      console.error('Error saving OpenAI config:', error);
      toast.error('Failed to save API key: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const isLoading = configLoading || validationLoading;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Settings</h2>
        <p className="text-muted-foreground">
          Configure AI-powered features and application settings
        </p>
      </div>

      {/* OpenAI Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Analysis Configuration
          </CardTitle>
          <CardDescription>
            Configure OpenAI API key to enable AI-powered document scanning and data extraction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          {!isLoading && (
            <Alert className={isConfigValid ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
              {isConfigValid ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    AI analysis is configured and ready to use
                  </AlertDescription>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    AI analysis is not configured. Enter your OpenAI API key below to enable this feature.
                  </AlertDescription>
                </>
              )}
            </Alert>
          )}

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={openAIConfig ? '••••••••••••••••••••••••' : 'sk-...'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                onClick={handleSave}
                disabled={saveOpenAIConfig.isPending || !apiKey.trim()}
              >
                {saveOpenAIConfig.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your API key is securely stored on the Internet Computer and never exposed to the frontend.
            </p>
          </div>

          {/* Information */}
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-sm">How to get an OpenAI API key:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com/api-keys</a></li>
              <li>Sign in or create an account</li>
              <li>Click "Create new secret key"</li>
              <li>Copy the key and paste it above</li>
            </ol>
            <p className="text-xs text-muted-foreground pt-2">
              Note: You'll need to add billing information to your OpenAI account to use the API.
            </p>
          </div>

          {/* Features enabled by AI */}
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium text-sm">Features enabled with AI:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Automatic extraction of patient data from scanned documents</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Smart field population from camera captures</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Reduced manual data entry and errors</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
