import './App.css';
import React,{useState, useEffect} from 'react';
import Axios from 'axios';
import axios from 'axios';
import stubs from './defaultStubs';
import moment from 'moment';

function App() {
  const[code,setCode] = useState('');
  const[output, setOutput] = useState('');
  const [language,setlanguage] = useState("cpp");
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState("");
  const [jobDetails,setJobDetails ] = useState(null);


 useEffect(()=> {
    setCode(stubs[language]);
 },[language]);
 

 const renderTimeDetailse = ()=>{
    if(!jobDetails){
       return " ";
    }
    
    let result = '';
    let {submittedAt, completedAt, startedAt} = jobDetails;
    submittedAt = moment(submittedAt).toString();
    result += `submitted At: ${submittedAt}`;
    if(!completedAt || !startedAt){
       return result;
    }
    const start = moment(startedAt);
    const  end = moment(completedAt);
    const executionTime = end.diff(start,'second',true);
    result = `execution Time : ${executionTime}s`
    return result;
 }


  const handleSubmit = async() =>{
      const payload = {
        language : language,
        code:code 
      };
  try{
  setJobId("");
  setStatus("");
  setOutput("");
  setJobDetails(null);

  const {data} = await Axios.post("http://localhost:5000/run", payload)
  setJobId(data.jobId);
  let intervalId;

  
  intervalId = setInterval(async()=>{

      const{data:dataRes} = await axios.get('http://localhost:5000/status', {params: {id:data.jobId}});

      const {success, job, error} = dataRes;

      if(success){

          const {status: jobStatus, output: jobOutput} = job;
          
          setStatus(jobStatus);
          setJobDetails(job);

          setOutput(jobOutput);
          clearInterval(intervalId);

          if(jobStatus === "pending")  return ;    
          

      }else{
        setStatus("Error : Please retry !");
         console.error(error);
         clearInterval(intervalId);
         setOutput(error);
      }
  },1000);


  }


  catch({response}){
    if(response){
      const errMsg = response.data.err.stderr;
      setOutput(errMsg);
  }else{
     setOutput("Error connecting to server!");
  }
  }
}

  return (
    <div className="App">
     <h1>Online Code Compiler</h1>
     <div>
        <select
          value={language}
          onChange={
             (e)=>{
              let response = window.confirm("WARNING:Switching the language,will remove your code"
              );
              if(response)
              {
               setlanguage(e.target.value);
               console.log(e.target.value);
              }
             }
          }
        >
            <label>language</label>
            <option value="cpp">C++</option>
            <option value="py">Python</option>
        </select>
     </div>
     <textarea
         rows ='20'
          cols='75'
          value ={code}
           onChange={(e)=>{setCode(e.target.value)
          }}
      >
      </textarea>
     <br/>
     <button onClick={handleSubmit}>Submit</button>
     <p>{status}</p>
     <p>{jobId && `JobId: ${jobId}`}</p>
     <p>{renderTimeDetailse()}</p>


     <p>{output}</p>
    </div>
  );
}

export default App;
