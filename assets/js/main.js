var cy;

function generate_cy_stylesheet(cy) {
  // This is a bit of a hack but it works
  html_style = document.getElementsByTagName('html')[0].style;

  // From https://js.cytoscape.org/#core/style
  cy.style()
    .fromJson([
      {
        selector: 'node',
        style: {
          label: 'data(id)',
          shape: 'round-rectangle',
          'background-color': html_style.getPropertyValue('--vscode-button-background'),
          'background-width': '90%',
          'background-height': '90%',
          width: '228',
          height: '128',
          'border-width': '0',
        },
      },
      {
        selector: 'label',
        style: {
          color: html_style.getPropertyValue('--vscode-button-foreground'),
          'font-family': '"Segoe UI", Arial, Helvetica, sans-serif',
          'font-size': '28vh',
          'text-valign': 'center',
          'text-halign': 'center',
        },
      },
      {
        selector: ':selected',
        style: {
          'border-width': '4',
          'border-color': html_style.getPropertyValue('--vscode-editor-hoverHighlightBackground'),
          'background-color': html_style.getPropertyValue('--vscode-button-hoverBackground'),
          'line-color': html_style.getPropertyValue('--vscode-minimap-errorHighlight'),
          'target-arrow-color': html_style.getPropertyValue('--vscode-minimap-errorHighlight'),
          'source-arrow-color': html_style.getPropertyValue('--vscode-minimap-errorHighlight'),
        },
      },
      {
        selector: 'edge',
        style: {
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'control-point-step-size': 40,
          width: 10,
        },
      },
    ])
    .update(); // indicate the end of your new stylesheet so that it can be updated on elements
}

function init() {
  vscode = acquireVsCodeApi();

  cy = cytoscape({
    container: document.getElementById('cy'),
    wheelSensitivity: 0.15,
    maxZoom: 5,
    minZoom: 0.2,
    selectionType: 'single',
  });

  generate_cy_stylesheet(cy);

  vscode.postMessage({ command: 'initialized' });
}

window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.redraw == true) {
    cy.remove('*');
  }

  nodeGraph = message.content;

  try {
    nodeGraph.vertices.forEach((element) => {
      cy.add({
        data: { id: element.label },
      });
    });

    nodeGraph.edges.forEach((element) => {
      cy.add({
        data: {
          id: element.source + element.target,
          source: element.source,
          target: element.target,
        },
      });
    });
  } catch (error) {
    vscode.postMessage({
      command: 'error',
      errorMsg: `Error building node graph from json graph data: ${error}`,
    });
  }

  cy.layout({
    avoidOverlap: true,
    name: 'breadthfirst',
    circle: false,
    nodeDimensionsIncludeLabels: true,
    spacingFactor: 1.5,
    animate: true,
  }).run();
});
