import { Play, Loader2, FileText, Mail, CheckCircle, AlertCircle } from 'lucide-react';

export default function CommandPad() {
  const [command, setCommand] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [clients, setClients] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load clients
    fetch('/src/data/clients.json')
      .then(res => res.json())
      .then(data => {
        setClients(data);
        if (data.length > 0) setSelectedClient(data[0].id);
      })
      .catch(err => console.error('Failed to load clients:', err));
  }, []);

  const parseCommand = (text) => {
    const lower = text.toLowerCase();
    
    // Detect scope
    let scope = 'general';
    if (lower.includes('risk')) scope = 'risk';
    else if (lower.includes('growth') || lower.includes('opportunity')) scope = 'growth';
    else if (lower.includes('investor')) scope = 'investor';
    
    // Detect template
    let template = 'executive';
    if (lower.includes('investor')) template = 'investor';
    else if (lower.includes('risk')) template = 'risk';
    
    // Detect delivery
    let deliver = 'display';
    if (lower.includes('email') || lower.includes('send')) deliver = 'email';
    
    // Detect action
    const isFusion = lower.includes('fusion') || lower.includes('analyze');
    const isReport = lower.includes('report') || lower.includes('generate');
    
    return { scope, template, deliver, isFusion, isReport };
  };

  const handleRun = async () => {
    if (!command.trim() || !selectedClient) {
      setError('Please enter a command and select a client');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const parsed = parseCommand(command);
      
      // Run fusion analysis
      if (parsed.isFusion) {
        const fusionRes = await fetch('/api/fusion/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: selectedClient,
            scope: parsed.scope
          })
        });
        
        const fusionData = await fusionRes.json();
        
        if (fusionData.success) {
          setResult({
            type: 'fusion',
            data: fusionData.fusion,
            meta: fusionData.meta
          });
        } else {
          throw new Error(fusionData.error || 'Fusion analysis failed');
        }
      }
      
      // Generate report
      if (parsed.isReport) {
        const reportRes = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: selectedClient,
            template: parsed.template,
            deliver: parsed.deliver
          })
        });
        const reportData = await reportRes.json();
        
        if (reportData.success) {
          setResult({
            type: 'report',
            data: reportData,
            template: parsed.template,
            deliver: parsed.deliver
          });
        } else {
          throw new Error(reportData.error || 'Report generation failed');
        }
      }
      
    } catch (err) {
      console.error('[CommandPad] Error:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleRun();
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Play className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">Manual Command Pad</h3>
      </div>

      {/* Client Selector */}
      <div className="mb-3">
        <label className="block text-sm text-slate-400 mb-1">Client</label>
        <select
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
          disabled={isProcessing}
        >
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name} ({client.industry})
            </option>
          ))}
        </select>
      </div>

      {/* Command Input */}
      <div className="mb-3">
        <label className="block text-sm text-slate-400 mb-1">Command</label>
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="e.g., 'fusion analysis for general scope' or 'generate investor report and display'"
          className="w-full bg-slate-900 text-white border border-slate-600 rounded-lg px-3 py-2 h-20 resize-none focus:outline-none focus:border-cyan-500"
          disabled={isProcessing}
        />
        <p className="text-xs text-slate-500 mt-1">
          Ctrl+Enter to run • Supports: fusion, analyze, report, risk, growth, investor, display, email
        </p>
      </div>

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={isProcessing || !command.trim() || !selectedClient}
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            Run Command
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold">Error</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="mt-4 p-4 bg-gradient-to-br from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h4 className="text-white font-semibold">
              {result.type === 'fusion' ? 'Fusion Analysis Complete' : 'Report Generated'}
            </h4>
          </div>

          {result.type === 'fusion' && (
            <div className="space-y-3">
              {/* Insights */}
              {result.data.insights?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-cyan-400 mb-1">Key Insights</p>
                  <ul className="space-y-1">
                    {result.data.insights.map((item, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-cyan-400">•</span>
                        <span>{item.insight} <span className="text-slate-500">({item.confidence})</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {result.data.risks?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-orange-400 mb-1">Risks</p>
                  <ul className="space-y-1">
                    {result.data.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-orange-400">•</span>
                        <span>{risk.description} <span className="text-slate-500">({risk.severity})</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Growth Opportunities */}
              {result.data.growth_ops?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-green-400 mb-1">Growth Opportunities</p>
                  <ul className="space-y-1">
                    {result.data.growth_ops.map((opp, idx) => (
                      <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="text-green-400">•</span>
                        <span>{opp.description} <span className="text-slate-500">({opp.potential})</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meta Info */}
              <div className="pt-2 border-t border-slate-600">
                <p className="text-xs text-slate-400">
                  Providers: {result.meta.providers.join(', ')} • 
                  Scope: {result.meta.scope} • 
                  Client: {result.meta.client_name}
                </p>
              </div>
            </div>
          )}

          {result.type === 'report' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-300">
                {result.deliver === 'email' 
                  ? '📧 Report sent via email successfully'
                  : '📄 Report generated and ready to view'}
              </p>
              
              {result.data.summary && (
                <div>
                  <p className="text-sm font-semibold text-blue-400 mb-1">Summary</p>
                  <p className="text-sm text-slate-300">{result.data.summary}</p>
                </div>
              )}

              {result.data.url && (
                <button
                  onClick={() => window.open(result.data.url, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all"
                >
                  <FileText className="w-4 h-4" />
                  Open Report
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
