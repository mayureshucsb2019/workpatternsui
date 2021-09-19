import './App.css';
import ResponseTimes from './ResponseTimes';
import Multiseries from './Multiseries';
import { Route, Link } from "react-router-dom";

function App() {

  return <div className="App">
    <Route exact path="/graph" component={Multiseries} />
    <Route exact path="/" component={ResponseTimes} />
  </div>
}

export default App;
