import { Component } from 'react';
import axios from "axios";
import MaterialTable from 'material-table';
import { Route, Link } from "react-router-dom";
import Multiseries from './Multiseries';
import { monthMapNum, monthMapString } from './utils/constants';

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

// this function gives the list of orgs and all yearmonth string and colums
const extractDateRangeOrg = function (organisationRespMap) {
    const date = new Date();
    let mindate = `${date.getFullYear()}${date.getMonth() + 1}`
    let maxdate = "197001";
    const columns = [
        { field: "nu", title: "No.", filterPlaceholder: "Filter" },
        { field: 'org', title: 'ORGANISATION', filterPlaceholder: "Filter" },
    ];
    const orgList = [];
    const monthYearList = [[], []];
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
    return [orgList, monthYearList, columns];
}

// this handles the pagination request
const populateRow = function (responseTimes, from, to, orgList, monthYearList) {
    // let previous = 0;
    const rows = [];
    // initialize setup to find aggregate
    let aggregate = {};
    aggregate["nu"] = 0;
    aggregate["org"] = "all";
    let noOrgsEveryMonth = {};
    for (let j = 0; j < monthYearList[0].length; j++) {
        aggregate[monthYearList[0][j]] = 0;
        noOrgsEveryMonth[monthYearList[0][j]] = 0;
    }

    // find the row for every organisation
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
                // find organisation every yearmonth and add their times to find aggregate average
                noOrgsEveryMonth[monthYearList[0][j]] += 1;
                aggregate[monthYearList[0][j]] += responseTimes[orgList[i]][monthYearList[0][j]];
                // previous = tempRow[monthYearList[0][j]];
            } else {
                // console.log(`${monthYearList[0][j]}: NA`);
                // tempRow[monthYearList[0][j]] = previous;
                tempRow[monthYearList[0][j]] = "";
            }
        }
        rows.push(tempRow);
    }

    // find average of the aggregate
    for (let j = 0; j < monthYearList[0].length; j++) {
        aggregate[monthYearList[0][j]] = convertToYearMonthDay(Math.floor(aggregate[monthYearList[0][j]] / noOrgsEveryMonth[monthYearList[0][j]]));
    }
    // add the aggregate at the start of the list
    rows.unshift(aggregate);
    return rows;
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
            if (!isNaN(yearmonth)) {
                seriesObject.dataPoints.push({ y: convertYearMonthDayToNumber(value) / (60 * 60 * 24), label: yearmonth.slice(0, 4) + " " + monthMapString[Number(yearmonth.slice(4, 6))] })
            }
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
            multiseries: [],
            rows: [],
            columns: []
        }
        console.log("Initial State set:", this.state);
    }

    componentDidMount() {
        console.log("ResponseTimes componentDidMount()");
        console.log(this.state);
        axios.get("http://localhost:4300/api/email_reply_time_table")
            .then(response => {
                const responseTimes = response.data.message;
                const [orgList, monthYearList, columns] = extractDateRangeOrg(responseTimes);
                const rows = populateRow(responseTimes, 0, 3000, orgList, monthYearList);
                // change of state
                this.setState(() => ({
                    multiseries: [],
                    rows: rows,
                    columns: columns
                }));
                console.log("New state on component mount:", this.state);
            })
    }

    // sends new selected multiseries rows
    handleSetState = (data) => {
        console.log("Handling set state");
        this.setState((prevState) => ({
            multiseries: data,
            rows: prevState.rows,
            columns: prevState.columns
        }));
    }

    render() {
        // const { columns, rows } = this.state;
        return (
            <div>
                {/* <button onClick={this.onSubmit}>generate multiseries</button> */}
                <Link to={{ pathname: '/graph', state: { data: this.state.multiseries, check: "Data is coming through" } }} ><button>Generate Multiseries</button></Link>
                <Route exact path="/graph" component={Multiseries} />
                <MaterialTable columns={this.state.columns} data={this.state.rows}
                    onSelectionChange={(selectedRows) => {
                        this.handleSetState(convertDataToMulitseriesData(selectedRows));
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