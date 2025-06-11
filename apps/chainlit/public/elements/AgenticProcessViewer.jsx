import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Brain, Code, Eye, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function AgenticProcessViewer() {
    const { iterations = [], status = "processing", error = null, finalResponse = null } = props;
    const [expandedSteps, setExpandedSteps] = useState(new Set());

    const toggleStep = (stepIndex) => {
        const newExpanded = new Set(expandedSteps);
        if (newExpanded.has(stepIndex)) {
            newExpanded.delete(stepIndex);
        } else {
            newExpanded.add(stepIndex);
        }
        setExpandedSteps(newExpanded);
    };

    const getStatusIcon = () => {
        switch (status) {
            case "processing":
                return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
            case "completed":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "error":
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case "processing":
                return "Processing...";
            case "completed":
                return "Completed";
            case "error":
                return "Error occurred";
            default:
                return "Processing...";
        }
    };

    return (
        <div className="space-y-4 max-w-4xl">
            {/* Status Header */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        {getStatusIcon()}
                        <span>Agentic AI Process</span>
                        <Badge variant={status === "error" ? "destructive" : status === "completed" ? "default" : "secondary"}>
                            {getStatusText()}
                        </Badge>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Iteration Steps */}
            {iterations.map((iteration, index) => {
                const isExpanded = expandedSteps.has(index);
                return (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleStep(index)}>
                            <CardTitle className="flex items-center justify-between text-base">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">Step {iteration.iteration}</Badge>
                                    <span className="text-sm font-medium text-gray-600">
                                        {iteration.naturalLanguageThought?.substring(0, 100)}
                                        {iteration.naturalLanguageThought?.length > 100 ? "..." : ""}
                                    </span>
                                </div>
                                <Button variant="ghost" size="sm" className="p-1 h-auto">
                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </Button>
                            </CardTitle>
                        </CardHeader>

                        {/* Collapsible Content */}
                        {isExpanded && (
                            <CardContent className="pt-0 space-y-4">
                                {/* Natural Language Thought */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-purple-500" />
                                        <h4 className="font-semibold text-sm text-purple-700">Natural Language Thought</h4>
                                    </div>
                                    <div className="bg-purple-50 p-3 rounded-md border-l-2 border-purple-200">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {iteration.naturalLanguageThought || "No thought available"}
                                        </p>
                                    </div>
                                </div>

                                {/* Structured Thought (JSON) */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Code className="h-4 w-4 text-blue-500" />
                                        <h4 className="font-semibold text-sm text-blue-700">Structured Thought (JSON)</h4>
                                    </div>
                                    <div className="bg-blue-50 p-3 rounded-md border-l-2 border-blue-200">
                                        <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                                            {iteration.structuredThought 
                                                ? JSON.stringify(iteration.structuredThought, null, 2)
                                                : "No structured thought available"
                                            }
                                        </pre>
                                    </div>
                                </div>

                                {/* Observation */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-green-500" />
                                        <h4 className="font-semibold text-sm text-green-700">Observation</h4>
                                    </div>
                                    <div className="bg-green-50 p-3 rounded-md border-l-2 border-green-200">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {iteration.observation || "No observation available"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                );
            })}

            {/* Final Response */}
            {finalResponse && (
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Final Response</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-green-50 p-4 rounded-md border-l-2 border-green-200">
                            <div className="prose prose-sm max-w-none text-gray-700">
                                {finalResponse}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error Display */}
            {error && (
                <Card className="border-l-4 border-l-red-500">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span>Error</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-red-50 p-4 rounded-md border-l-2 border-red-200">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Processing Indicator */}
            {status === "processing" && iterations.length === 0 && (
                <Card>
                    <CardContent className="py-8">
                        <div className="flex items-center justify-center gap-3 text-gray-500">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Waiting for AI to start processing...</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 