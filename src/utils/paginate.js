export async function paginate(callback) {
  let offset = 0;
  const limit = 100;
  let totalCount = Infinity;
  while (offset < totalCount) {
    const output = await callback({
      offset,
      limit,
    });
    totalCount = output.totalCount;
    offset += output.itemCount;
  }
}
