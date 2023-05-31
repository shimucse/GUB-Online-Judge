const Queue = require("bull");
const jobQueue = new Queue("job-runner-queue");
  const {executeCpp,deleteForDotOut} = require('./executeCpp');
const { executePy,deleteForDotPy} = require('./executePy');
const Job = require('./models/job');
const {deleteFile} = require('./generateFile');



const Num_WORKERS = 5;
let filepath;
const executCpp_and_executePy = async(job,item,deleteFileSet)=>{
    let output;
    if(job.language === "cpp"){
        output = await executeCpp(job.filepath,item);
        if(deleteFileSet){
            await deleteFile(job.filepath);
            await deleteForDotOut();
        }
        

    }else {
        output = await executePy(job.filepath, item);
        if(deleteFileSet) await deleteForDotPy();
    } 
    console.log("output from exectue:"+output);
    return output;
}
jobQueue.process(Num_WORKERS, async({data})=>{

   // console.log(data);
    const{id:jobId}= data;
    const job = await Job.findById(jobId);

    if(job === undefined){
        throw Error("job not found")
    } 
    try{
        let output;
            job["startedAt"]= new Date();
            
            
            //Memory1
            let Memoryused1 = process.memoryUsage().heapUsed; 
            console.log("memory1 :"+Memoryused1);


            //execute 
            Array.isArray(job.input)
            /*?job.userInput.map( async(item) => {
                console.log("item: "+ item)
                job['output'] = await executCpp_and_executePy(job,item);
                 
                }):( job['output'] = await executCpp_and_executePy(job,item))*/
                let deleteFileSet = true;

                if(job.submitType === 'submit'){

                    deleteFileSet = false;
                    const outputLength =2; 
                    let jobinput = job.input;                  
                    let incrementNumber = jobinput.length;
                    
                    const linesnum =(jobinput.split("\n")).length;  
                    let endindex = (outputLength-1);
                 
                        for(let i=0; i<linesnum; i = i+outputLength)
                        {
                            let newStr;
                            let inputStr="";

                                for(let j =i; j<outputLength+i; j++){
                                    
                                    newStr=  ((jobinput.split('\n')[j]).trim());
                                    if(j!==(outputLength+i-1)){

                                        newStr = newStr.concat('\n');    

                                    }
                                    inputStr = inputStr.concat(newStr);                     

                                }
                                console.log('newStr :  '+inputStr);                   
                                if(i===(linesnum-2))  {
                                    console.log("last stage");
                                    deleteFileSet = true;
                                    job['output'] = 'Accepted'
                                }
                                await executCpp_and_executePy(job,inputStr,deleteFileSet)

                             }

                }else{                   

                    job['output'] = await executCpp_and_executePy(job,job.input,deleteFileSet)   

                }

            
            //Memory2
            let Memoryused2 = process.memoryUsage().heapUsed;
            console.log("memory2 :"+Memoryused2);
            console.log("total Memory used:"+(Memoryused2-Memoryused1) ); 
            let memoryUsedForCompilation =  ((((Memoryused2-Memoryused1)/ 1024 / 1024)*100)/100);
            console.log("memoryUsedForCompilationProgramm"+ memoryUsedForCompilation+"MB");           


            job['completedAt'] = new Date();
            job['status'] = "success";
            job['memorySpace'] = memoryUsedForCompilation;
            console.log("job memorySpace"+job.memorySpace);
            await job.save();  
            
    }catch(err){
            job['completedAt'] = new Date();
            job['status'] = "error";
            //job['output'] = JSON.stringify(err);
            job['output'] = err;

            
            await job.save();     

        }
});
jobQueue.on('failed',(error)=>{

     console.log(error.data.id, "failed", error.failedReason);
})


const addJobToQueue = async(jobId, filePath) =>{
   filepath = filePath;
    await jobQueue.add({
        id: jobId,
    });

};

module.exports = {

    addJobToQueue

}