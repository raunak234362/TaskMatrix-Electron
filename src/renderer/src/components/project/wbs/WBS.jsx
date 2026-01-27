import AllWBS from "./AllWBS";

const WBS = ({ id, stage }) => {
  console.log(id);

  return (
    <>
      <AllWBS id={id} stage={stage} />
    </>
  );
};

export default WBS;
