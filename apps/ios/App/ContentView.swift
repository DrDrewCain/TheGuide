//
//  ContentView.swift
//  TheGuide
//
//  Created by M on 9/17/25.
//

import SwiftUI

struct ContentView: View {
    @State private var showingDecisionCreation = false
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            // Dashboard Tab
            DashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "square.grid.2x2")
                }
                .tag(0)

            // Decisions Tab
            DecisionsListView(showingDecisionCreation: $showingDecisionCreation)
                .tabItem {
                    Label("Decisions", systemImage: "brain.head.profile")
                }
                .tag(1)

            // Profile Tab
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle")
                }
                .tag(2)
        }
        .sheet(isPresented: $showingDecisionCreation) {
            DecisionCreationView()
        }
    }
}

struct DashboardView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Welcome Section
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Welcome back!")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        Text("What life decision can we help you with today?")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal)

                    // Quick Stats
                    HStack(spacing: 16) {
                        StatCard(title: "Active Decisions", value: "3", color: .blue)
                        StatCard(title: "Simulations Run", value: "12", color: .green)
                    }
                    .padding(.horizontal)

                    // Recent Decisions
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recent Decisions")
                            .font(.headline)
                            .padding(.horizontal)

                        ForEach(0..<3) { index in
                            RecentDecisionCard(
                                title: "Software Engineer at Tech Corp",
                                type: .jobOffer,
                                date: Date()
                            )
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("TheGuide")
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(value)
                .font(.largeTitle)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

struct RecentDecisionCard: View {
    let title: String
    let type: DecisionType
    let date: Date

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                Text(type.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Text(date, style: .date)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

struct DecisionsListView: View {
    @Binding var showingDecisionCreation: Bool

    var body: some View {
        NavigationView {
            List {
                // Active Decisions Section
                Section("Active Decisions") {
                    ForEach(0..<2) { index in
                        DecisionRow(
                            title: "Move to Austin for Tech Job",
                            status: .analyzing,
                            progress: 0.3
                        )
                    }
                }

                // Completed Decisions Section
                Section("Completed Decisions") {
                    ForEach(0..<3) { index in
                        DecisionRow(
                            title: "MBA vs Continue Working",
                            status: .decided,
                            progress: 1.0
                        )
                    }
                }
            }
            .navigationTitle("Decisions")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingDecisionCreation = true }) {
                        Label("New Decision", systemImage: "plus")
                    }
                }
            }
        }
    }
}

struct DecisionRow: View {
    let title: String
    let status: DecisionStatus
    let progress: Double

    var statusColor: Color {
        switch status {
        case .draft: return .gray
        case .analyzing: return .orange
        case .simulated: return .blue
        case .decided: return .green
        case .implemented: return .purple
        case .archived: return .gray
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)

            HStack {
                Label(status.rawValue.capitalized, systemImage: "circle.fill")
                    .font(.caption)
                    .foregroundColor(statusColor)

                Spacer()

                if progress < 1.0 {
                    ProgressView(value: progress)
                        .frame(width: 80)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct ProfileView: View {
    var body: some View {
        NavigationView {
            List {
                Section("Personal Information") {
                    ProfileRow(label: "Age", value: "28")
                    ProfileRow(label: "Location", value: "San Francisco, CA")
                    ProfileRow(label: "Education", value: "Bachelor's in CS")
                }

                Section("Career") {
                    ProfileRow(label: "Current Role", value: "Software Engineer")
                    ProfileRow(label: "Experience", value: "5 years")
                    ProfileRow(label: "Industry", value: "Technology")
                }

                Section("Financial") {
                    ProfileRow(label: "Risk Tolerance", value: "Moderate")
                    ProfileRow(label: "Credit Score", value: "750")
                }

                Section("Settings") {
                    Button("Connect Financial Accounts") {
                        // Implement Plaid connection
                    }
                    Button("Privacy Settings") {
                        // Show privacy settings
                    }
                    Button("Notifications") {
                        // Show notification settings
                    }
                }
            }
            .navigationTitle("Profile")
        }
    }
}

struct ProfileRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
