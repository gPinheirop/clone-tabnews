function status(request, response) {
  response.status(200).json({
    message: "teste"
  });
}

export default status;
