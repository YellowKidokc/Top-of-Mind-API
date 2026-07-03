import { useEffect, useState } from "react";
import { preparePrompt } from "../ai/autoAgent.browser";
import { useProjects, useRoadmap } from "../utils/useData";

const AICoPilot = () => {
  const projects = useProjects();
  const roadmap = useRoadmap();
  const [analysisResult, setAnalysisResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate AI analysis prompt with current project/roadmap data
      const prompt = preparePrompt(projects, roadmap);
      
      // Display the prepared prompt (you can enhance this to call backend AI service)
      setAnalysisResult(prompt.text);
    } catch (err) {
      console.error("AICoPilot Analysis Error:", err);
      setError("Failed to process analysis. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleExternalTrigger = () => {
      handleAnalysis();
      document
        .querySelector("[data-ai-copilot]")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    window.addEventListener("runCoPilotAnalysis", handleExternalTrigger);
    return () => window.removeEventListener("runCoPilotAnalysis", handleExternalTrigger);
  }, [projects, roadmap]);

  return (
    <div data-ai-copilot className="p-6 bg-gray-900 text-white h-full rounded-lg shadow-lg border border-gray-800">
      <h2 className="text-2xl font-semibold mb-4">Emma AI CoPilot</h2>

      <button
        onClick={handleAnalysis}
        disabled={loading}
        className={`px-5 py-2 rounded-md text-white ${
          loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Analyzing..." : "Generate Strategic Analysis"}
      </button>

      {error && <p className="text-red-400 mt-3">{error}</p>}

      {analysisResult && (
        <div className="mt-6 bg-gray-800 border border-gray-700 rounded-md p-4">
          <h3 className="text-lg font-semibold mb-2 text-blue-400">Analysis Report</h3>
          <pre className="whitespace-pre-wrap text-gray-200 text-sm font-mono">{analysisResult}</pre>
        </div>
      )}
    </div>
  );
};

export default AICoPilot;
