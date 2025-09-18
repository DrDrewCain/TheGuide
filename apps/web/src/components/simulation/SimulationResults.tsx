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
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Financial Outcome Distribution</CardTitle>
              <CardDescription>
                Range of possible financial outcomes with probabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={outcomeDistribution}
                  margin={{ top: 20, right: 30, left: 60, bottom: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 10, fill: '#666' }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={Math.floor(outcomeDistribution.length / 8)} // Show fewer labels
                  />
                  <YAxis
                    label={{
                      value: 'Probability',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      style: { textAnchor: 'middle' }
                    }}
                    tickFormatter={(value) => formatPercent(value)}
                    tick={{ fill: '#666' }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatPercent(value)}
                    labelFormatter={(label) => `Outcome Range: ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                  />
                  <Bar
                    dataKey="probability"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  >
                    {outcomeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.isConfidenceInterval
                            ? '#10b981'
                            : entry.isMedian
                            ? '#8b5cf6'
                            : '#3b82f6'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 flex justify-center gap-6 text-sm px-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-[#3b82f6] rounded" />
                  <span className="text-gray-600">Most Likely</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-[#8b5cf6] rounded" />
                  <span className="text-gray-600">Median Outcome</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-[#10b981] rounded" />
                  <span className="text-gray-600">95% Confidence</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Projected Outcomes Over Time</CardTitle>
              <CardDescription>
                Expected trajectory with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-6">
              <ResponsiveContainer width="100%" height={450}>
                <LineChart
                  data={timeSeriesData}
                  margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="year"
                    label={{
                      value: 'Years from Now',
                      position: 'insideBottom',
                      offset: -5,
                      style: { textAnchor: 'middle' }
                    }}
                    tick={{ fill: '#666' }}
                  />
                  <YAxis
                    yAxisId="financial"
                    label={{
                      value: 'Net Worth ($)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      style: { textAnchor: 'middle' }
                    }}
                    tickFormatter={(value) => {
                      if (value === 0) return '$0';
                      if (value < 0) return `-$${Math.abs(value / 1000).toFixed(0)}k`;
                      return `$${(value / 1000).toFixed(0)}k`;
                    }}
                    tick={{ fill: '#666' }}
                    width={80}
                  />
                  <YAxis
                    yAxisId="satisfaction"
                    orientation="right"
                    label={{
                      value: 'Satisfaction Score',
                      angle: 90,
                      position: 'insideRight',
                      offset: 10,
                      style: { textAnchor: 'middle' }
                    }}
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fill: '#666' }}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name.includes('Worth') || name.includes('Bound')) {
                        return formatCurrency(value);
                      }
                      return value.toFixed(1);
                    }}
                    labelStyle={{ color: '#333', fontWeight: 'bold' }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{
                      paddingTop: '20px',
                      fontSize: '12px'
                    }}
                    iconType="line"
                  />
                  <Line
                    yAxisId="financial"
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#3b82f6"
                    name="Expected Net Worth"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="financial"
                    type="monotone"
                    dataKey="netWorthLower"
                    stroke="#3b82f6"
                    strokeDasharray="5 5"
                    name="95% Lower Bound"
                    opacity={0.4}
                    dot={false}
                  />
                  <Line
                    yAxisId="financial"
                    type="monotone"
                    dataKey="netWorthUpper"
                    stroke="#3b82f6"
                    strokeDasharray="5 5"
                    name="95% Upper Bound"
                    opacity={0.4}
                    dot={false}
                  />
                  <Line
                    yAxisId="satisfaction"
                    type="monotone"
                    dataKey="satisfaction"
                    stroke="#10b981"
                    name="Job Satisfaction"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#10b981' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="satisfaction"
                    type="monotone"
                    dataKey="happiness"
                    stroke="#f59e0b"
                    name="Overall Happiness"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#f59e0b' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Scenario Cloud</CardTitle>
              <CardDescription>
                Each point represents a possible future scenario
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-6">
              <ResponsiveContainer width="100%" height={450}>
                <ScatterChart
                  margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="financial"
                    name="Financial Outcome"
                    tickFormatter={(value) => {
                      if (value === 0) return '$0';
                      if (value < 0) return `-$${Math.abs(value / 1000).toFixed(0)}k`;
                      return `$${(value / 1000).toFixed(0)}k`;
                    }}
                    label={{
                      value: 'Financial Outcome',
                      position: 'insideBottom',
                      offset: -5,
                      style: { textAnchor: 'middle' }
                    }}
                    tick={{ fill: '#666' }}
                  />
                  <YAxis
                    dataKey="happiness"
                    name="Happiness"
                    label={{
                      value: 'Overall Happiness Score',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      style: { textAnchor: 'middle' }
                    }}
                    domain={[0, 10]}
                    ticks={[0, 2, 4, 6, 8, 10]}
                    tick={{ fill: '#666' }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === 'Financial Outcome'
                        ? formatCurrency(value)
                        : value.toFixed(1)
                    }
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      padding: '10px'
                    }}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  <Scatter
                    name="Scenarios"
                    data={scenarioCloud}
                    fill="#3b82f6"
                  >
                    {scenarioCloud.map((entry, index) => {
                      // Color points based on outcome quality
                      const color =
                        entry.financial > 100000 && entry.happiness > 7
                          ? '#10b981' // Green for good outcomes
                          : entry.financial < 0 || entry.happiness < 5
                          ? '#ef4444' // Red for poor outcomes
                          : '#3b82f6'; // Blue for average
                      return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.7} />;
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-6 flex justify-center gap-6 text-sm px-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-[#10b981] rounded-full opacity-70" />
                  <span className="text-gray-600">Excellent Outcomes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-[#3b82f6] rounded-full opacity-70" />
                  <span className="text-gray-600">Average Outcomes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-[#ef4444] rounded-full opacity-70" />
                  <span className="text-gray-600">Poor Outcomes</span>
                </div>
              </div>
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
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {Icon && (
          <div className={`p-2 rounded-full ${
            trend === 'up' ? 'bg-green-100' :
            trend === 'down' ? 'bg-red-100' :
            'bg-blue-100'
          }`}>
            <Icon className={`h-4 w-4 ${
              trend === 'up' ? 'text-green-600' :
              trend === 'down' ? 'text-red-600' :
              'text-blue-600'
            }`} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {trend && (
            trend === 'up' ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )
          )}
        </div>
        {max && (
          <div className="mt-3">
            <Progress
              value={(parseFloat(value) / max) * 100}
              className="h-2"
            />
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-3">{subtitle}</p>
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

  const binCount = Math.min(10, values.length); // Reduced bins to avoid overlap
  const binSize = (max - min) / binCount;

  const bins = Array(binCount).fill(0).map((_, i) => {
    const binMin = min + i * binSize;
    const binMax = min + (i + 1) * binSize;
    return {
      min: binMin,
      max: binMax,
      count: 0,
      range: binMin < 0 && binMax > 0
        ? '$0'
        : binMin < 0
        ? `-$${Math.abs(Math.round(binMin / 1000))}k`
        : `$${Math.round(binMin / 1000)}k`
    };
  });

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