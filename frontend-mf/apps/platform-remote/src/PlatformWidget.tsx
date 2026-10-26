import React, { useEffect, useState } from "react";
import { Card, Badge, Button } from "@enterprise/shared-ui";
import { GitBranch, Server, Cpu, PlayCircle, ExternalLink, ArrowRight } from "lucide-react";

interface PlatformWidgetProps {
  onNavigateToCatalog?: () => void;
  token?: string;
}

export function PlatformWidget({ onNavigateToCatalog, token }: PlatformWidgetProps) {
  const [stats, setStats] = useState({
    totalServices: 4,
    activePipelines: 2,
    k8sPods: 6,
    healthRate: "100%",
  });

  return (
    <Card className="p-5 border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50">
      <div className="flex items-center justify-between pb-3 border-b border-indigo-100/60 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Developer Platform Hub</h4>
            <p className="text-xs text-slate-500">Git repos, CI/CD pipelines & K8s cluster</p>
          </div>
        </div>
        <Badge variant="success">Local K8s Active</Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-indigo-500" /> Services
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.totalServices}</div>
        </div>
        <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-emerald-500" /> Git Repos
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.totalServices}</div>
        </div>
        <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
            <PlayCircle className="w-3.5 h-3.5 text-amber-500" /> Pipelines
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.activePipelines}</div>
        </div>
        <div className="p-3 bg-white rounded-lg border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-500" /> K8s Pods
          </div>
          <div className="text-xl font-bold text-emerald-600">{stats.k8sPods}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Git Engine: <strong className="text-slate-700">Gitea</strong></span>
          <span>•</span>
          <span>CI/CD: <strong className="text-slate-700">Woodpecker/Tekton</strong></span>
        </div>
        {onNavigateToCatalog && (
          <Button size="sm" variant="outline" onClick={onNavigateToCatalog}>
            Open Service Catalog <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </div>
    </Card>
  );
}

export default PlatformWidget;
