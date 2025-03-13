import "./App.css";
import Layout from "./shared/Layout";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <div className="App">
      <ToastContainer />
      <Layout />
    </div>
  );
}

export default App;
