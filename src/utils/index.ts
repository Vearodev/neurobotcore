export function GenerateRandomNumber() {

}

export function PrettyJSON(data: any) {

      const jsonString = JSON.stringify(data, null, 2);
    

      return  `<pre>${jsonString}</pre>`;
}