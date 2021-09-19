import React from 'react';
import CanvasJSReact from './canvasjs.react';
import ResponseTimes from './ResponseTimes';
import { Redirect, Route, Link } from "react-router-dom";

const Component = React.Component;
const CanvasJS = CanvasJSReact.CanvasJS;
const CanvasJSChart = CanvasJSReact.CanvasJSChart;


class Multiseries extends Component {


	render() {
		console.log("PROPS IS: ", this.props);
		const options = {
			animationEnabled: true,
			title: {
				text: "Response time graph wrt organisations"
			},
			axisY: {
				title: "Time in number of seconds"
			},
			toolTip: {
				shared: true
			},
			data: this.props.data || this.props.location || [{
				type: "spline",
				name: "2016",
				showInLegend: true,
				dataPoints: [
					{ y: 155, label: "Jan" },
					{ y: 150, label: "Feb" },
					{ y: 152, label: "Mar" },
					{ y: 148, label: "Apr" },
					{ y: 142, label: "May" },
					{ y: 150, label: "Jun" },
					{ y: 146, label: "Jul" },
					{ y: 149, label: "Aug" },
					{ y: 153, label: "Sept" },
					{ y: 158, label: "Oct" },
					{ y: 154, label: "Nov" },
					{ y: 150, label: "Dec" }
				]
			},
			{
				type: "spline",
				name: "2017",
				showInLegend: true,
				dataPoints: [
					{ y: 172, label: "Jan" },
					{ y: 173, label: "Feb" },
					{ y: 175, label: "Mar" },
					{ y: 172, label: "Apr" },
					{ y: 162, label: "May" },
					{ y: 165, label: "Jun" },
					{ y: 172, label: "Jul" },
					{ y: 168, label: "Aug" },
					{ y: 175, label: "Sept" },
					{ y: 170, label: "Oct" },
					{ y: 165, label: "Nov" },
					{ y: 169, label: "Dec" }
				]
			}]
		}

		return (
			<div>
				<Link to={{ pathname: '/' }} >Main Page</Link>
				<Route exact path="/" component={ResponseTimes} />
				<CanvasJSChart options={options}
				/* onRef={ref => this.chart = ref} */
				/>
				{/*You can get reference to the chart instance as shown above using onRef. This allows you to access all chart properties and methods*/}
			</div>
		);
	}
}

export default Multiseries;