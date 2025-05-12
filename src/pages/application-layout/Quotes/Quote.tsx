import { useParams } from "react-router-dom";
import Page from "@/components/Page";
import { Card } from "@/components/ui/card";

const Quote = () => {
  const { quoteId } = useParams();

  return (
    <Page title="Quote Details" subtitle={`Viewing quote ${quoteId}`}>
      <Card className="flex-grow flex flex-col p-4 gap-4">
        <div>Quote details will be implemented here</div>
      </Card>
    </Page>
  );
};

export default Quote;
