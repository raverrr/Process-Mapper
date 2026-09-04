import { ReactFlowProvider } from '@xyflow/react';
import { Editor } from './components/Editor';

export default function App() {
  return (
    <ReactFlowProvider>
      <Editor />
    </ReactFlowProvider>
  );
}
