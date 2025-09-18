'use client';

import React from 'react';
import { SimulationResult } from '@theguide/models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Info,
  DollarSign,
  Briefcase,
  Heart
} from 'lucide-react';

interface SimulationResultsProps {
  result: SimulationResult;
  quickEstimate?: any;
  sensitivity?: any;
  onBack?: () => void;
}

export default function SimulationResults({ result, quickEstimate, sensitivity, onBack }: SimulationResultsProps) {
  const { aggregateMetrics, scenarios, recommendations, risks, opportunities } = result;
  const showSensitivity = !!sensitivity;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Prepare data for visualizations
  const outcomeDistribution = prepareOutcomeDistribution(scenarios);
  const timeSeriesData = prepareTimeSeriesData(scenarios);
  const scenarioCloud = prepareScenarioCloud(scenarios);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
        >
          ← Back to Decision Form
        </button>
      )}

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Expected Financial Outcome"
          value={formatCurrency(aggregateMetrics.expectedValue.financial)}
          trend={aggregateMetrics.expectedValue.financial > 0 ? 'up' : 'down'}
          subtitle={`${formatPercent(aggregateMetrics.volatility.financial)} volatility`}
          icon={DollarSign}
        />
        <MetricCard
          title="Career Satisfaction"
          value={aggregateMetrics.expectedValue.career.toFixed(1)}
          max={10}
          subtitle="Expected satisfaction score"
          icon={Briefcase}
        />
        <MetricCard
          title="Life Balance"
          value={aggregateMetrics.expectedValue.lifestyle.toFixed(1)}
          max={10}
          subtitle="Overall happiness index"
          icon={Heart}
        />
      </div>

      {/* Success Probability */}
      <Card>
        <CardHeader>
          <CardTitle>Probability of Success</CardTitle>
          <CardDescription>
            Likelihood of achieving positive outcomes across all dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {formatPercent(aggregateMetrics.probabilityOfSuccess)}
              </span>
              <Badge
                variant={
                  aggregateMetrics.probabilityOfSuccess > 0.7
                    ? 'default'
                    : aggregateMetrics.probabilityOfSuccess > 0.5
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {aggregateMetrics.probabilityOfSuccess > 0.7
                  ? 'High Confidence'
                  : aggregateMetrics.probabilityOfSuccess > 0.5
                  ? 'Moderate'
                  : 'Low Confidence'}
              </Badge>
            </div>
            <Progress
              value={aggregateMetrics.probabilityOfSuccess * 100}
              className="h-3"
            />
            <p className="text-sm text-muted-foreground">
              Based on {scenarios.length} simulated scenarios with{' '}
              {formatPercent(aggregateMetrics.confidenceInterval.confidence)} confidence
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Outcome Distribution</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          {showSensitivity && <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>}
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Outcome Distribution</CardTitle>
              <CardDescription>
                Range of possible financial outcomes with probabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={outcomeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    label={{ value: 'Probability', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatPercent(value)}
                    labelFormatter={(label) => `Outcome: ${label}`}
                  />
                  <Bar dataKey="probability" fill="#8884d8">
                    {outcomeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isConfidenceInterval
                            ? '#22c55e'
                            : entry.isMedian
                            ? '#3b82f6'
                            : '#8884d8'
                        }
                      />
                    ))}
                  </Bar>
                  <ReferenceLine
                    x={aggregateMetrics.expectedValue.financial}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    label="Expected"
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-[#3b82f6]" />
                  <span>Median</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-[#22c55e]" />
                  <span>95% Confidence</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-[#ef4444]" />
                  <span>Expected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projected Outcomes Over Time</CardTitle>
              <CardDescription>
                Expected trajectory with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottom' }} />
                  <YAxis
                    yAxisId="financial"
                    label={{ value: 'Net Worth ($)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <YAxis
                    yAxisId="satisfaction"
                    orientation="right"
                    label={{ value: 'Satisfaction', angle: 90, position: 'insideRight' }}
                    domain={[0, 10]}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name.includes('Worth')
                        ? formatCurrency(value)
                        : value.toFixed(1)
                    }
                  />
                  <Legend />
                  <Line
                    yAxisId="financial"
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#8884d8"
                    name="Net Worth"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="financial"
                    type="monotone"
                    dataKey="netWorthLower"
                    stroke="#8884d8"
                    strokeDasharray="3 3"
                    name="Lower Bound"
                    opacity={0.5}
                  />
                  <Line
                    yAxisId="financial"
                    type="monotone"
                    dataKey="netWorthUpper"
                    stroke="#8884d8"
                    strokeDasharray="3 3"
                    name="Upper Bound"
                    opacity={0.5}
                  />
                  <Line
                    yAxisId="satisfaction"
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="#82ca9d"
                    name="Job Satisfaction"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="satisfaction"
                    type="monotone"
                    dataKey="happiness"
                    stroke="#ffc658"
                    name="Overall Happiness"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Cloud</CardTitle>
              <CardDescription>
                Each point represents a possible future scenario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="financial"
                    name="Financial Outcome"
                    tickFormatter={(value) => `${value / 1000}k`}
                    label={{ value: 'Financial Outcome ($k)', position: 'insideBottom' }}
                  />
                  <YAxis
                    dataKey="happiness"
                    name="Happiness"
                    label={{ value: 'Overall Happiness', angle: -90, position: 'insideLeft' }}
                    domain={[0, 10]}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'Financial Outcome'
                        ? formatCurrency(value)
                        : value.toFixed(1)
                    }
                  />
                  <Scatter
                    name="Scenarios"
                    data={scenarioCloud}
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {showSensitivity && sensitivity && (
          <TabsContent value="sensitivity" className="space-y-4">
            <SensitivityAnalysis sensitivity={sensitivity} />
          </TabsContent>
        )}
      </Tabs>

      {/* Recommendations and Risks */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Key Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((rec) => (
                <Alert key={rec.id} className="border-green-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{rec.title}</strong>
                    <p className="mt-1 text-sm">{rec.description}</p>
                    {rec.potentialImpact && (
                      <p className="mt-2 text-sm font-medium text-green-600">
                        Potential impact: +{rec.potentialImpact}%
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Key Risks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {risks.slice(0, 3).map((risk) => (
                <Alert key={risk.id} className="border-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{risk.description}</strong>
                    <p className="mt-1 text-sm">
                      Probability: {formatPercent(risk.probability)}
                    </p>
                    {risk.mitigation && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Mitigation: {risk.mitigation[0]}
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components

function MetricCard({
  title,
  value,
  max,
  trend,
  subtitle,
  icon: Icon
}: {
  title: string;
  value: string;
  max?: number;
  trend?: 'up' | 'down';
  subtitle?: string;
  icon?: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )
          )}
        </div>
        {max && (
          <Progress value={(parseFloat(value) / max) * 100} className="mt-2 h-2" />
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SensitivityAnalysis({ sensitivity }: { sensitivity: any }) {
  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parameter Sensitivity</CardTitle>
        <CardDescription>
          Which factors have the biggest impact on outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sensitivity.keyDrivers.map((driver: any) => (
            <div key={driver.parameter} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{driver.parameter}</span>
                <span>{formatPercent(driver.importance)}</span>
              </div>
              <Progress value={driver.importance * 100} className="h-2" />
              {driver.interactions > 0.1 && (
                <p className="text-xs text-muted-foreground">
                  Strong interactions with other parameters
                </p>
              )}
            </div>
          ))}
        </div>
        {sensitivity.recommendation && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>{sensitivity.recommendation}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Data preparation functions

function prepareOutcomeDistribution(scenarios: any[]) {
  // Validate scenarios
  if (!scenarios || scenarios.length === 0) {
    return [];
  }

  // Create histogram bins
  const values = scenarios
    .map(s => s?.outcomes?.year10?.financialPosition?.netWorth)
    .filter(v => v !== undefined && v !== null && !isNaN(v));

  if (values.length === 0) {
    return [];
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  // Handle edge case where all values are the same
  if (min === max) {
    return [{
      min,
      max,
      count: values.length,
      range: `${Math.round(min / 1000)}k`,
      probability: 1,
      isMedian: true,
      isConfidenceInterval: true
    }];
  }

  const binCount = Math.min(20, values.length);
  const binSize = (max - min) / binCount;

  const bins = Array(binCount).fill(0).map((_, i) => ({
    min: min + i * binSize,
    max: min + (i + 1) * binSize,
    count: 0,
    range: `${Math.round((min + i * binSize) / 1000)}k-${Math.round((min + (i + 1) * binSize) / 1000)}k`
  }));

  // Count values in each bin
  values.forEach(value => {
    const binIndex = Math.min(Math.max(0, Math.floor((value - min) / binSize)), binCount - 1);
    if (bins[binIndex]) {
      bins[binIndex].count++;
    }
  });

  // Convert to probabilities
  return bins.map(bin => ({
    ...bin,
    probability: bin.count / values.length,
    isMedian: false, // Would need to calculate
    isConfidenceInterval: false // Would need to calculate
  }));
}

function prepareTimeSeriesData(scenarios: any[]) {
  if (!scenarios || scenarios.length === 0) {
    return [];
  }

  const years = ['year1', 'year3', 'year5', 'year10'];
  const yearNumbers = [1, 3, 5, 10];

  return yearNumbers.map((year, i) => {
    const yearKey = years[i];
    const financialValues = scenarios
      .map(s => s?.outcomes?.[yearKey]?.financialPosition?.netWorth)
      .filter(v => v !== undefined && v !== null && !isNaN(v));
    const satisfactionValues = scenarios
      .map(s => s?.outcomes?.[yearKey]?.careerProgress?.jobSatisfaction)
      .filter(v => v !== undefined && v !== null && !isNaN(v));
    const happinessValues = scenarios
      .map(s => s?.outcomes?.[yearKey]?.lifeMetrics?.overallHappiness)
      .filter(v => v !== undefined && v !== null && !isNaN(v));

    return {
      year,
      netWorth: financialValues.length > 0 ? average(financialValues) : 0,
      netWorthLower: financialValues.length > 0 ? percentile(financialValues, 5) : 0,
      netWorthUpper: financialValues.length > 0 ? percentile(financialValues, 95) : 0,
      satisfaction: satisfactionValues.length > 0 ? average(satisfactionValues) : 0,
      happiness: happinessValues.length > 0 ? average(happinessValues) : 0
    };
  });
}

function prepareScenarioCloud(scenarios: any[]) {
  if (!scenarios || scenarios.length === 0) {
    return [];
  }

  return scenarios
    .slice(0, 200)
    .filter(s => s?.outcomes?.year10)
    .map(scenario => ({
      financial: scenario?.outcomes?.year10?.financialPosition?.netWorth || 0,
      happiness: scenario?.outcomes?.year10?.lifeMetrics?.overallHappiness || 0,
      satisfaction: scenario?.outcomes?.year10?.careerProgress?.jobSatisfaction || 0
    }))
    .filter(point => !isNaN(point.financial) && !isNaN(point.happiness) && !isNaN(point.satisfaction));
}

// Utility functions
function average(values: number[]) {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((p / 100) * sorted.length);
  return sorted[index];
}