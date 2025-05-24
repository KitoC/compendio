interface GetSDCResponseProps {
  url: string;
  key: string;
  offer: RTCSessionDescriptionInit;
}

export const getSDCResponse = async ({
  url,
  key,
  offer,
}: GetSDCResponseProps) => {
  const sdpResponse = await fetch(`${url}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/sdp",
    },
  });

  return sdpResponse;
};
