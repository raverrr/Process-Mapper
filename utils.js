const nodeTypeDescriptions = {
  'start-end': 'Start/End Event: Represents the beginning or end of a process (e.g., "Process Start" or "Process Complete").',
  'task': 'Activity/Task: Denotes a specific task or step in the process (e.g., "Review Document" or "Send Email").',
  'decision': 'Decision Point: Indicates a decision where the flow splits based on a condition (e.g., "Is approval granted?").',
  'event': 'Event: Represents an intermediate event like a delay or message (e.g., "Wait for Response").',
  'input-output': 'Input/Output: Indicates data or material entering or leaving the process (e.g., "Receive Input Data").',
  'document': 'Document: Represents a physical or digital document (e.g., "Invoice" or "Contract").',
  'database': 'Data Storage: Indicates a database or storage system (e.g., "Customer Database").',
  'preparation': 'Preparation: Indicates a setup step before a task (e.g., "Prepare Equipment").'
};

let nodeId = 0;
let swimlaneId = 0;
let connections = [];
let nodeData = {};

const canvas = document.getElementById('canvas');

function getNodeType(node) {
  return Array.from(node.classList).find(cls => nodeTypeDescriptions[cls]) || 'task';
}

function getNodeHeight(type) {
  return type === 'database' ? 60 : 50;
}