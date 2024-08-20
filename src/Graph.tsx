import React, { Component } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[];
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void;
}
class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = (document.getElementsByTagName('perspective-viewer')[0] as unknown) as PerspectiveViewerElement;

    const schema = {
      price_abc: 'float',
      price_def: 'float',
      ratio: 'float',
      timestamp: 'date',
      upper_bound: 'float',
      lower_bound: 'float',
      trigger_alert: 'float',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      elem.setAttribute('column-pivots', '["stock"]');
      elem.setAttribute('row-pivots', '["timestamp"]');
      elem.setAttribute('columns', '["ratio", "lower_bound", "upper_bound", "trigger_alert"]');
      elem.setAttribute(
        'aggregates',
        JSON.stringify({
          price_abc: 'avg',
          price_def: 'avg',
          ratio: 'avg',
          timestamp: 'distinct count',
          upper_bound: 'avg',
          lower_bound: 'avg',
          trigger_alert: 'avg',
        }),
      );
    }
  }

  componentDidUpdate() {
    if (this.table) {
      const rows = DataManipulator.generateRow(this.props.data);

      // Transform the rows into the correct TableData format
      const tableData: Record<string, (string | number | boolean | Date)[]> = {
        price_abc: [],
        price_def: [],
        ratio: [],
        timestamp: [],
        upper_bound: [],
        lower_bound: [],
        trigger_alert: [],
      };

      rows.forEach(row => {
        tableData.price_abc.push(row.price_abc);
        tableData.price_def.push(row.price_def);
        tableData.ratio.push(row.ratio);
        tableData.timestamp.push(row.timestamp);
        tableData.upper_bound.push(row.upper_bound);
        tableData.lower_bound.push(row.lower_bound);
        if (row.trigger_alert !== undefined) {
          tableData.trigger_alert.push(row.trigger_alert);
        } else {
          tableData.trigger_alert.push();
        }
      });

      this.table.update([tableData]);
    }
  }
}

export default Graph;
