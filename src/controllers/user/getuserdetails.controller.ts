import {
  constructErrorResponseBody,
  constructSuccessResponseBody
} from "../../modules";
import {
  AuthenticationDestructuredType,
  ControllerType,
  UserDetailsResponseType
} from "../../utils/types";

const getUserDetailsController: ControllerType = (req, res) => {
  const { body } = req;
  const { fetchedUserDetails } = body as AuthenticationDestructuredType;
  if (!fetchedUserDetails) {
    return res.status(403).json(constructErrorResponseBody("Not allowed!"));
  }
  const { id, avatar, updatedAt, createdAt, role, name, email } =
    fetchedUserDetails;
  const data: UserDetailsResponseType = {
    avatar,
    createdAt,
    email,
    id: id?.toString(),
    name,
    role,
    updatedAt
  };
  return res.status(200).json(constructSuccessResponseBody(data));
};

export default getUserDetailsController;
