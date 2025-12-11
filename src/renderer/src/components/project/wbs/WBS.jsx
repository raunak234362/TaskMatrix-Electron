import AllWBS from "./AllWBS";

const WBS = ({id}: {id: string}) => {
    console.log(id);
    
    return (<AllWBS id={id} />);
};

export default WBS;
