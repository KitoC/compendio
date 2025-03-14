import styled from "styled-components";
import defaultChatbotAvatar from "../../assets/default-chatbot-avatar.jpg";
import { useAppConfig } from "../../contexts/appConfig";

const AvatarContainer = styled.div`
  width: 2.5rem; /* w-10 */
  height: 2.5rem; /* h-10 */
  border-radius: 9999px; /* rounded-full */
  flex-shrink: 0;
  overflow: hidden;
  margin-left: 0; /* ml-3 when isUser */
  margin-right: 0.75rem; /* mr-3 when !isUser */
`;

const AvatarImage = styled.img`
  width: 100%; /* w-full */
  height: 100%; /* h-full */
  object-fit: cover;
`;

const Avatar = () => {
  const { aiAgent } = useAppConfig();

  return (
    <AvatarContainer>
      <AvatarImage
        src={aiAgent?.avatar_url || defaultChatbotAvatar}
        alt={"AI Avatar"}
      />
    </AvatarContainer>
  );
};

export default Avatar;
