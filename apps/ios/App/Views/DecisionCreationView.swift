//
//  DecisionCreationView.swift
//  TheGuide
//
//  View for creating new life decisions
//

import SwiftUI

struct DecisionCreationView: View {
    @Environment(\.dismiss) var dismiss
    @State private var decisionType: DecisionType = .careerChange
    @State private var title = ""
    @State private var description = ""
    @State private var options: [DecisionOptionDraft] = [
        DecisionOptionDraft(),
        DecisionOptionDraft()
    ]

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Decision Type Selection
                    VStack(alignment: .leading, spacing: 12) {
                        Text("What decision are you facing?")
                            .font(.headline)

                        ForEach(DecisionType.allCases, id: \.self) { type in
                            DecisionTypeCard(
                                type: type,
                                isSelected: decisionType == type,
                                action: { decisionType = type }
                            )
                        }
                    }

                    Divider()

                    // Basic Information
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Tell us about your situation")
                            .font(.headline)

                        TextField("Decision Title", text: $title)
                            .textFieldStyle(RoundedBorderTextFieldStyle())

                        VStack(alignment: .leading, spacing: 4) {
                            Text("Description")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            TextEditor(text: $description)
                                .frame(minHeight: 80)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                                )
                        }
                    }

                    // Decision-specific fields
                    DecisionSpecificFields(decisionType: decisionType)

                    Divider()

                    // Options
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Options You're Considering")
                            .font(.headline)

                        ForEach(options.indices, id: \.self) { index in
                            OptionCard(
                                option: $options[index],
                                index: index + 1
                            )
                        }

                        Button(action: addOption) {
                            Label("Add Another Option", systemImage: "plus.circle.fill")
                                .foregroundColor(.blue)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("New Decision")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Next") {
                        // Move to simulation parameters
                    }
                    .disabled(title.isEmpty || options.allSatisfy { $0.title.isEmpty })
                }
            }
        }
    }

    private func addOption() {
        options.append(DecisionOptionDraft())
    }
}

struct DecisionTypeCard: View {
    let type: DecisionType
    let isSelected: Bool
    let action: () -> Void

    var typeInfo: (title: String, description: String, icon: String) {
        switch type {
        case .careerChange:
            return ("Career Change", "Switching careers or industries", "briefcase.fill")
        case .jobOffer:
            return ("Job Offer", "Evaluating a new opportunity", "doc.text.fill")
        case .relocation:
            return ("Relocation", "Moving to a new city", "map.fill")
        case .education:
            return ("Education", "Pursuing further education", "graduationcap.fill")
        case .homePurchase:
            return ("Home Purchase", "Buying vs renting", "house.fill")
        case .investment:
            return ("Investment", "Major financial decision", "chart.line.uptrend.xyaxis")
        case .familyPlanning:
            return ("Family Planning", "Life-changing family decisions", "person.3.fill")
        case .retirement:
            return ("Retirement", "Planning your retirement", "clock.fill")
        case .businessStartup:
            return ("Business Startup", "Starting your own business", "lightbulb.fill")
        }
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: typeInfo.icon)
                    .font(.title2)
                    .foregroundColor(isSelected ? .white : .blue)
                    .frame(width: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text(typeInfo.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(isSelected ? .white : .primary)
                    Text(typeInfo.description)
                        .font(.caption)
                        .foregroundColor(isSelected ? .white.opacity(0.9) : .secondary)
                }

                Spacer()
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.blue : Color.gray.opacity(0.1))
            )
        }
    }
}

struct DecisionSpecificFields: View {
    let decisionType: DecisionType
    @State private var currentSalary = ""
    @State private var offeredSalary = ""
    @State private var currentCity = ""
    @State private var destinationCity = ""

    var body: some View {
        Group {
            switch decisionType {
            case .jobOffer, .careerChange:
                VStack(alignment: .leading, spacing: 12) {
                    Text("Financial Details")
                        .font(.headline)

                    HStack(spacing: 12) {
                        VStack(alignment: .leading) {
                            Text("Current Salary")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            TextField("$120,000", text: $currentSalary)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.numberPad)
                        }

                        VStack(alignment: .leading) {
                            Text("New Salary")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            TextField("$150,000", text: $offeredSalary)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .keyboardType(.numberPad)
                        }
                    }
                }

            case .relocation:
                VStack(alignment: .leading, spacing: 12) {
                    Text("Location Details")
                        .font(.headline)

                    HStack(spacing: 12) {
                        VStack(alignment: .leading) {
                            Text("Current City")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            TextField("San Francisco, CA", text: $currentCity)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }

                        VStack(alignment: .leading) {
                            Text("Destination City")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            TextField("Austin, TX", text: $destinationCity)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                        }
                    }
                }

            default:
                EmptyView()
            }
        }
    }
}

struct OptionCard: View {
    @Binding var option: DecisionOptionDraft
    let index: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Option \(index)")
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(.secondary)

            TextField("Option Title", text: $option.title)
                .textFieldStyle(RoundedBorderTextFieldStyle())

            VStack(alignment: .leading, spacing: 4) {
                Text("Description")
                    .font(.caption)
                    .foregroundColor(.secondary)
                TextEditor(text: $option.description)
                    .frame(minHeight: 60)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                    )
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.gray.opacity(0.05))
        )
    }
}

// Draft model for creating decisions
struct DecisionOptionDraft {
    var title = ""
    var description = ""
    var pros: [String] = []
    var cons: [String] = []
}

struct DecisionCreationView_Previews: PreviewProvider {
    static var previews: some View {
        DecisionCreationView()
    }
}