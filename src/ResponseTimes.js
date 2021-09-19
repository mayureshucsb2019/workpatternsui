import { Component } from 'react';
import axios from "axios";
import MaterialTable from 'material-table';
import { Redirect, Route, Link } from "react-router-dom";
import Multiseries from './Multiseries';

const monthMapNum = { 0: "01", 1: "02", 2: "03", 3: "04", 4: "05", 5: "06", 6: "07", 7: "08", 8: "09", 9: "10", 10: "11", 11: "12" };
const monthMapString = { 0: "Jan", 1: "Feb", 2: "Mar", 3: "Apr", 4: "May", 5: "Jun", 6: "July", 7: "Aug", 8: "Sep", 9: "Oct", 10: "Nov", 11: "Dec" };
let orgList = [];
let monthYearList = [[], []];

let selectedMultiSeries = []

const columns = [
    { field: "nu", title: "No.", filterPlaceholder: "Filter" },
    { field: 'org', title: 'ORGANISATION', filterPlaceholder: "Filter" },
];

const rows = [
    // { org: 123.com, yearmonth: 123 },
];

// takes parameter in seconds
const convertToYearMonthDay = function (time) {
    let remaining = time;
    let month = Math.floor(time / (60 * 60 * 24 * 30));
    // this is the remaining days
    remaining %= 60 * 60 * 24 * 30;
    let days = Math.floor(remaining / (60 * 60 * 24));
    // this is remaining hours
    remaining %= 60 * 60 * 24;
    let hours = Math.floor(remaining / (60 * 60));
    remaining %= 60 * 60;
    let minutes = Math.floor(remaining / 60);
    remaining %= 60;
    // console.log([month, days, hours, minutes, remaining])
    return `${(month < 10 ? 0 : "")}${month}M\n` + `${(days < 10 ? 0 : "")}${days}D\n` + `${(hours < 10 ? 0 : "")}${hours}h\n` + `${(minutes < 10 ? 0 : "")}${minutes}m\n` + `${(remaining < 10 ? 0 : "")}${remaining}s\n`
    // return (month ? `${(month<10?0:"")}${month}M\n` : "") + (days ? `${(days<10?0:"")}${days}D\n` : "") + (hours ? `${(hours<10?0:"")}${hours}h\n` : "") + (minutes ? `${(minutes<10?0:"")}${minutes}m\n` : "") + (remaining ? `${(remaining<10?0:"")}${remaining}s\n` : "")
}

const convertYearMonthDayToNumber = function (timeString) {
    if (timeString.length === 20) {
        const month = Number(timeString.slice(0, 2));
        const days = Number(timeString.slice(4, 6));
        const hours = Number(timeString.slice(8, 10));
        const minutes = Number(timeString.slice(12, 14));
        const seconds = Number(timeString.slice(16, 18));
        return month * 30 * 24 * 60 * 60 + days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
    }
    return 0
}

// this function gives the list of orgs and all yearmonth string 
const extractDateRangeOrg = function (organisationRespMap) {
    const date = new Date();
    let mindate = `${date.getFullYear()}${date.getMonth() + 1}`
    let maxdate = "197001";
    // go over the keys to find the range of year and months 
    // also store the names of all the orgs for ease of use
    for (const [org, obj] of Object.entries(organisationRespMap)) {
        // store org in the list of orgs
        orgList.push(org)
        for (const [yearMonth] of Object.entries(obj)) {
            if (yearMonth < mindate) {
                mindate = yearMonth;
            }
            if (yearMonth > maxdate) {
                maxdate = yearMonth;
            }
        }
    }
    let [minYear, minMonth] = [Number(mindate.slice(0, 4)), Number(mindate.slice(4, 6))]
    let tempYear = minYear;
    let tempMonth = minMonth - 1;
    let stringYearMonth = mindate;
    // generate the list of all the yearmonth string in the range
    // also generate the month year naming 
    while (stringYearMonth <= maxdate) {
        columns.push({ field: stringYearMonth, title: `${tempYear}${monthMapString[tempMonth]}`, filterPlaceholder: "Filter" });
        monthYearList[0].push(stringYearMonth);
        monthYearList[1].push(`${tempYear}${monthMapString[tempMonth]}`);
        tempMonth = (tempMonth + 1) % 12;
        if (tempMonth === 0) {
            tempYear += 1;
        }
        stringYearMonth = `${tempYear}${monthMapNum[tempMonth]}`;
    }
    // console.log("Organisations: ", orgList);
    // console.log("MonthYear List:", monthYearList);
    // console.log("Columns: ", columns);
    return [orgList, monthYearList];
}

// this handles the pagination request
const populateRowColumn = function (responseTimes, from, to) {
    // let previous = 0;
    for (let i = from; i < Math.min(to, orgList.length); i++) {
        let tempRow = {};
        tempRow["nu"] = i + 1;
        tempRow['org'] = orgList[i];
        // previous = 0;
        for (let j = 0; j < monthYearList[0].length; j++) {
            // console.log(`${monthYearList[0][j]}`);
            if (responseTimes[orgList[i]].hasOwnProperty(monthYearList[0][j])) {
                // console.log(`${monthYearList[0][j]}: ${responseTimes[orgList[i]][monthYearList[0][j]]} #END`);
                tempRow[monthYearList[0][j]] = convertToYearMonthDay(responseTimes[orgList[i]][monthYearList[0][j]]);
                // previous = tempRow[monthYearList[0][j]];
            } else {
                // console.log(`${monthYearList[0][j]}: NA`);
                // tempRow[monthYearList[0][j]] = previous;
                tempRow[monthYearList[0][j]] = "";
            }
        }
        rows.push(tempRow);
    }
}

const convertDataToMulitseriesData = function (dataObject) {
    const finalData = [];
    const numberOfOrgs = dataObject.length;
    console.log("Number of datapoints: ", numberOfOrgs)
    for (let i = 0; i < numberOfOrgs; i++) {
        let data = dataObject[i];
        let seriesObject = {
            type: "spline",
            name: dataObject[i].org,
            showInLegend: true,
            dataPoints: [] // { y: 155, label: "Jan" }
        }
        for (const [yearmonth, value] of Object.entries(data)) {
            seriesObject.dataPoints.push({ y: convertYearMonthDayToNumber(value), label: yearmonth })
        }
        finalData.push(seriesObject);
    }
    // console.log("--->", finalData);
    return finalData;
}

class ResponseTimes extends Component {
    constructor(props) {
        super(props)

        this.state = {
            rows: [],
            columns: []
        }
    }

    // onSubmit = () => {
    //     console.log("Multiseries button has been clicked!", selectedMultiSeries)
    //     return <Redirect to={{ pathname: '/graph', state: { data: selectedMultiSeries } }} />
    // }

    componentDidMount() {
        console.log("ResponseTimes componentDidMount()");
        axios.get("http://localhost:4300/api/email_reply_time_table")
            .then(response => {
                let responseTimes = response.data.message;
                extractDateRangeOrg(response.data.message);
                populateRowColumn(responseTimes, 0, 300);
                // change of state
                this.setState({
                    rows: rows,
                    columns: columns
                });
            })
    }

    render() {
        const { columns, rows } = this.state;
        return (
            <div>
                {/* <button onClick={this.onSubmit}>generate multiseries</button> */}
                <Link to={{ pathname: '/graph', state: { data: selectedMultiSeries } }} >Generate Multiseries</Link>
                <Route exact path="/graph" component={Multiseries} />
                <MaterialTable columns={columns} data={rows}
                    onSelectionChange={(selectedRows) => {
                        selectedMultiSeries = convertDataToMulitseriesData(selectedRows);
                        console.log("selectedMultiSeries: ", selectedMultiSeries);
                    }}
                    options={{
                        filtering: true, pageSizeOptions: [5, 10, 20, 50, 100], paginationPosition: "both",
                        exportButton: true, exportAllData: true, selection: true, showTextRowsSelected: false,
                        columnsButton: true
                    }}
                    title="Email Response Time" />
            </div>
        )
    }
}

export default ResponseTimes;